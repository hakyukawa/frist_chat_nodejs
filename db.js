const mysql = require('mysql2/promise');
require('dotenv').config();
const utils = require('./utils/utils'); // Assuming utils.js is in the same directory

// データベース設定
const dbConfig = {
  host: process.env.MYSQL_HOSTNAME,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DATABASE
};

// テーブル定義
const tableDefinitions = {
  'user': `
    CREATE TABLE user (
      USER_ID VARCHAR(30) PRIMARY KEY,
      USER_NAME VARCHAR(20) NOT NULL,
      MAIL VARCHAR(30) NOT NULL UNIQUE,
      PASSWORD CHAR(64) NOT NULL,
      ICON_URL VARCHAR(255),
      ITEM_ID CHAR(36),
      USER_RANK INT DEFAULT 0 NOT NULL,
      POINT INT DEFAULT 0 NOT NULL CHECK (POINT >= 0),
      CREATED_AT DATETIME NOT NULL,
      FOREIGN KEY (ITEM_ID) REFERENCES item(ITEM_ID)
    )
  `,
  'friendship': `
    CREATE TABLE friendship (
      USER_ID_1 VARCHAR(30) NOT NULL,
      USER_ID_2 VARCHAR(30) NOT NULL,
      FRIEND_CREATED_AT DATETIME NOT NULL,
      PRIMARY KEY (USER_ID_1, USER_ID_2),
      FOREIGN KEY (USER_ID_1) REFERENCES user(USER_ID),
      FOREIGN KEY (USER_ID_2) REFERENCES user(USER_ID),
      CHECK (USER_ID_1 < USER_ID_2)
    )
  `,
  'friend_request': `
    CREATE TABLE friend_request (
      RIQUEST_ID CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      SENDER_ID VARCHAR(30) NOT NULL,
      RECEIVER_ID VARCHAR(30) NOT NULL,
      STATUS TINYINT DEFAULT 0 NOT NULL CHECK (STATUS BETWEEN 0 AND 3),
      CREATED_AT DATETIME NOT NULL,
      UPDATED_AT DATETIME NOT NULL,
      FOREIGN KEY (SENDER_ID) REFERENCES user(USER_ID),
      FOREIGN KEY (RECEIVER_ID) REFERENCES user(USER_ID)
    )
  `,
  'server': `
    CREATE TABLE server (
      SERVER_ID CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      OWNER_ID VARCHAR(30) NOT NULL,
      SERVER_NAME VARCHAR(20) NOT NULL,
      ICON_URL VARCHAR(255) NOT NULL,
      UNTIL_REPLY TIME NOT NULL,
      START_AT TIME NOT NULL,
      END_AT TIME NOT NULL,
      WEEKS BIT(7) DEFAULT b'0000000' NOT NULL,
      START_CORE_TIME TIME,
      END_CORE_TIME TIME,
      CREATED_AT DATETIME NOT NULL,
      FOREIGN KEY (OWNER_ID) REFERENCES user(USER_ID)
    )
  `,
  'channel': `
    CREATE TABLE channel (
      CHANNEL_ID CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      SERVER_ID CHAR(36) NOT NULL,
      CHANNEL_NAME VARCHAR(30) NOT NULL,
      CREATED_AT DATETIME NOT NULL,
      FOREIGN KEY (SERVER_ID) REFERENCES server(SERVER_ID)
    )
  `,
  'server_user': `
    CREATE TABLE server_user (
      SERVER_ID CHAR(36) NOT NULL,
      USER_ID VARCHAR(30) NOT NULL,
      IS_MUTED BOOLEAN DEFAULT FALSE NOT NULL,
      LAST_ACTIVITY DATETIME NOT NULL,
      JOINED_AT DATETIME NOT NULL,
      PRIMARY KEY (SERVER_ID, USER_ID),
      FOREIGN KEY (SERVER_ID) REFERENCES server(SERVER_ID),
      FOREIGN KEY (USER_ID) REFERENCES user(USER_ID)
    )
  `,
  'message': `
    CREATE TABLE message (
      MESSAGE_ID CHAR(36) PRIMARY KEY,
      CHANNEL_ID CHAR(36) NOT NULL,
      SENDER_ID VARCHAR(30) NOT NULL,
      CONTENT VARCHAR(1000) NOT NULL,
      EDITED_AT DATETIME,
      CREATED_AT DATETIME NOT NULL,
      FOREIGN KEY (CHANNEL_ID) REFERENCES channel(CHANNEL_ID),
      FOREIGN KEY (SENDER_ID) REFERENCES user(USER_ID)
    )
  `,
  'read_status': `
    CREATE TABLE read_status (
      CHANNEL_ID CHAR(36) NOT NULL,
      USER_ID VARCHAR(30) NOT NULL,
      LAST_READ_MESSAGE_ID CHAR(36),
      LAST_MESSAGE_ID CHAR(36),
      UNREAD_COUNT INT DEFAULT 0 CHECK (UNREAD_COUNT >= 0),
      LAST_VIEWED_AT DATETIME,
      LAST_UPDATED_AT DATETIME,
      PRIMARY KEY (CHANNEL_ID, USER_ID),
      FOREIGN KEY (CHANNEL_ID) REFERENCES channel(CHANNEL_ID),
      FOREIGN KEY (USER_ID) REFERENCES user(USER_ID),
      FOREIGN KEY (LAST_READ_MESSAGE_ID) REFERENCES message(MESSAGE_ID),
      FOREIGN KEY (LAST_MESSAGE_ID) REFERENCES message(MESSAGE_ID)
    )
  `,
  'item_type': `
    CREATE TABLE item_type (
      TYPE_ID INT PRIMARY KEY,
      TYPE_NAME VARCHAR(30) NOT NULL
    )
  `,
  'item': `
    CREATE TABLE item (
      ITEM_ID CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      ITEM_NAME VARCHAR(30) NOT NULL,
      ITEM_TYPE INT NOT NULL,
      ITEM_POINT INT NOT NULL CHECK (ITEM_POINT > 0),
      DESCRIPTION CHAR(36) NOT NULL,
      IMAGE_URL VARCHAR(255) NOT NULL,
      CREATED_AT DATETIME NOT NULL,
      FOREIGN KEY (ITEM_TYPE) REFERENCES item_type(TYPE_ID)
    )
  `,
  'user_item': `
    CREATE TABLE user_item (
      USER_ID VARCHAR(30) NOT NULL,
      ITEM_ID CHAR(36) NOT NULL,
      GOT_AT DATETIME NOT NULL,
      PRIMARY KEY (USER_ID, ITEM_ID),
      FOREIGN KEY (USER_ID) REFERENCES user(USER_ID),
      FOREIGN KEY (ITEM_ID) REFERENCES item(ITEM_ID)
    )
  `,
  'transaction_history': `
    CREATE TABLE transaction_history (
      TRANSACTION_ID CHAR(36) PRIMARY KEY,
      USER_ID VARCHAR(30) NOT NULL,
      ITEM_ID CHAR(36) NOT NULL,
      USED_POINT INT NOT NULL CHECK (USED_POINT > 0),
      TRANSACTION_AT DATETIME NOT NULL,
      FOREIGN KEY (USER_ID) REFERENCES user(USER_ID),
      FOREIGN KEY (ITEM_ID) REFERENCES item(ITEM_ID)
    )
  `,
  'trophy': `
    CREATE TABLE trophy (
      TROPHY_ID CHAR(36) PRIMARY KEY,
      TROPHY_NAME VARCHAR(20) NOT NULL,
      CONDITIONS VARCHAR(100) NOT NULL,
      RARITY INT NOT NULL,
      CREATED_AT DATETIME NOT NULL
    )
  `,
  'user_trophy': `
    CREATE TABLE user_trophy (
      USER_ID VARCHAR(30) NOT NULL,
      TROPHY_ID CHAR(36) NOT NULL,
      GOT_AT DATETIME NOT NULL,
      PRIMARY KEY (USER_ID, TROPHY_ID),
      FOREIGN KEY (USER_ID) REFERENCES user(USER_ID),
      FOREIGN KEY (TROPHY_ID) REFERENCES trophy(TROPHY_ID)
    )
  `
};

// テストデータ定義
const testData = {
  'user': [
    {
      USER_ID: 'test1',
      USER_NAME: 'test1',
      MAIL: 'test1@example.com',
      PASSWORD: utils.hashPassword('password1'),
      CREATED_AT: utils.getCurrentDateTime()
    },
    {
      USER_ID: 'test2',
      USER_NAME: 'test2',
      MAIL: 'test2@example.com',
      PASSWORD: utils.hashPassword('password2'),
      CREATED_AT: utils.getCurrentDateTime()
    }
  ],
  'item_type': [
    {
      TYPE_ID: 1,
      TYPE_NAME: 'test_type'
    }
  ]
};

// データベース接続を確立
async function createConnection() {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    utils.logInfo("DB接続成功");
    return connection;
  } catch (err) {
    utils.logError(err, 'DB接続');
    throw err;
  }
}

// データベースの存在確認と作成
async function ensureDatabaseExists(connection) {
  try {
    const [rows] = await connection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbConfig.database]
    );
    
    if (rows.length === 0) {
      utils.logInfo(`データベース ${dbConfig.database} を作成します`);
      await connection.execute(`CREATE DATABASE ${dbConfig.database}`);
      utils.logInfo("データベース作成完了");
    } else {
      utils.logInfo(`データベース ${dbConfig.database} は既に存在します`);
    }
    
    await connection.changeUser({database: dbConfig.database});
    utils.logInfo(`データベース ${dbConfig.database} に接続しました`);
  } catch (err) {
    utils.logError(err, 'データベース作成');
    throw err;
  }
}

// テーブルの存在確認
async function checkTableExists(connection, tableName) {
  const [rows] = await connection.execute(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, 
    [dbConfig.database, tableName]
  );
  return rows.length > 0;
}

// テーブル作成
async function createTables(connection) {
  // テーブルの作成順序
  const tableOrder = [
    'user', 'item_type', 'friendship', 'friend_request', 'server', 
    'channel', 'server_user', 'message', 'read_status', 'item', 
    'user_item', 'transaction_history', 'trophy', 'user_trophy'
  ];
  
  for (const tableName of tableOrder) {
    const tableExists = await checkTableExists(connection, tableName);
    
    if (!tableExists) {
      utils.logInfo(`テーブル ${tableName} を作成します`);
      await connection.execute(tableDefinitions[tableName]);
      utils.logInfo(`テーブル ${tableName} の作成が完了しました`);
      
      // テストデータの挿入
      await insertTestData(connection, tableName);
    } else {
      utils.logInfo(`テーブル ${tableName} は既に存在します`);
    }
  }
}

// テストデータの挿入
async function insertTestData(connection, tableName) {
  try {
    switch (tableName) {
      case 'user':
        if (testData.user) {
          for (const user of testData.user) {
            await connection.query('INSERT INTO user SET ?', user);
          }
          utils.logInfo('ユーザーテストデータを挿入しました');
        }
        break;
        
      case 'item_type':
        if (testData.item_type) {
          for (const itemType of testData.item_type) {
            await connection.query('INSERT INTO item_type SET ?', itemType);
          }
          utils.logInfo('アイテムタイプテストデータを挿入しました');
        }
        break;
        
      case 'friendship':
        // userテーブルからデータを取得して関連データを作成
        const [users] = await connection.query('SELECT USER_ID FROM user ORDER BY USER_ID LIMIT 2');
        if (users.length >= 2) {
          const friendship = {
            USER_ID_1: users[0].USER_ID < users[1].USER_ID ? users[0].USER_ID : users[1].USER_ID,
            USER_ID_2: users[0].USER_ID < users[1].USER_ID ? users[1].USER_ID : users[0].USER_ID,
            FRIEND_CREATED_AT: utils.getCurrentDateTime()
          };
          await connection.query('INSERT INTO friendship SET ?', friendship);
          utils.logInfo('フレンドシップテストデータを挿入しました');
        }
        break;
        
      case 'server':
        // サーバー作成
        const [owners] = await connection.query('SELECT USER_ID FROM user LIMIT 1');
        if (owners.length > 0) {
          const server = {
            SERVER_ID: utils.generateUUID(),
            OWNER_ID: owners[0].USER_ID,
            SERVER_NAME: 'test_server',
            ICON_URL: 'https://example.com/icon.png',
            UNTIL_REPLY: '00:30:00',
            START_AT: '18:00:00',
            END_AT: '09:00:00',
            WEEKS: 0b1001001,
            START_CORE_TIME: '10:00:00',
            END_CORE_TIME: '16:00:00',
            CREATED_AT: utils.getCurrentDateTime()
          };
          await connection.query('INSERT INTO server SET ?', server);
          utils.logInfo('サーバーテストデータを挿入しました');
        }
        break;
        
      case 'channel':
        // 最新のサーバーにチャンネルを作成
        const [servers] = await connection.query('SELECT SERVER_ID FROM server ORDER BY CREATED_AT DESC LIMIT 1');
        if (servers.length > 0) {
          const channel = {
            CHANNEL_ID: utils.generateUUID(),
            SERVER_ID: servers[0].SERVER_ID,
            CHANNEL_NAME: 'general',
            CREATED_AT: utils.getCurrentDateTime()
          };
          await connection.query('INSERT INTO channel SET ?', channel);
          utils.logInfo('チャンネルテストデータを挿入しました');
        }
        break;
        
      case 'server_user':
        // サーバーとユーザーの関連付け
        const [serverData] = await connection.query('SELECT SERVER_ID FROM server ORDER BY CREATED_AT DESC LIMIT 1');
        const [userData] = await connection.query('SELECT USER_ID FROM user LIMIT 1');
        if (serverData.length > 0 && userData.length > 0) {
          const serverUser = {
            SERVER_ID: serverData[0].SERVER_ID,
            USER_ID: userData[0].USER_ID,
            IS_MUTED: false,
            LAST_ACTIVITY: utils.getCurrentDateTime(),
            JOINED_AT: utils.getCurrentDateTime()
          };
          await connection.query('INSERT INTO server_user SET ?', serverUser);
          utils.logInfo('サーバーユーザーテストデータを挿入しました');
        }
        break;
        
      case 'message':
        // チャンネルとユーザーに紐づくメッセージを作成
        const [channels] = await connection.query('SELECT CHANNEL_ID FROM channel ORDER BY CREATED_AT DESC LIMIT 1');
        const [senders] = await connection.query('SELECT USER_ID FROM user LIMIT 1');
        if (channels.length > 0 && senders.length > 0) {
          const message = {
            MESSAGE_ID: utils.generateUUID(),
            CHANNEL_ID: channels[0].CHANNEL_ID,
            SENDER_ID: senders[0].USER_ID,
            CONTENT: 'test_message',
            CREATED_AT: utils.getCurrentDateTime()
          };
          await connection.query('INSERT INTO message SET ?', message);
          utils.logInfo('メッセージテストデータを挿入しました');
        }
        break;
        
      case 'read_status':
        // 既読ステータス作成
        const [channelData] = await connection.query('SELECT CHANNEL_ID FROM channel ORDER BY CREATED_AT DESC LIMIT 1');
        const [userReadData] = await connection.query('SELECT USER_ID FROM user LIMIT 1');
        const [messageData] = await connection.query('SELECT MESSAGE_ID FROM message ORDER BY CREATED_AT DESC LIMIT 1');
        
        if (channelData.length > 0 && userReadData.length > 0 && messageData.length > 0) {
          const readStatus = {
            CHANNEL_ID: channelData[0].CHANNEL_ID,
            USER_ID: userReadData[0].USER_ID,
            LAST_READ_MESSAGE_ID: messageData[0].MESSAGE_ID,
            LAST_MESSAGE_ID: messageData[0].MESSAGE_ID,
            UNREAD_COUNT: 0,
            LAST_VIEWED_AT: utils.getCurrentDateTime(),
            LAST_UPDATED_AT: utils.getCurrentDateTime()
          };
          await connection.query('INSERT INTO read_status SET ?', readStatus);
          utils.logInfo('既読ステータステストデータを挿入しました');
        }
        break;
        
      case 'item':
        // アイテムを作成
        const [itemTypes] = await connection.query('SELECT TYPE_ID FROM item_type LIMIT 1');
        if (itemTypes.length > 0) {
          const item = {
            ITEM_ID: utils.generateUUID(),
            ITEM_NAME: 'test_item',
            ITEM_TYPE: itemTypes[0].TYPE_ID,
            ITEM_POINT: 100,
            DESCRIPTION: 'test_description',
            IMAGE_URL: 'test_image_url',
            CREATED_AT: utils.getCurrentDateTime()
          };
          await connection.query('INSERT INTO item SET ?', item);
          utils.logInfo('アイテムテストデータを挿入しました');
        }
        break;
        
      case 'user_item':
        // ユーザーのアイテム所持情報を作成
        const [itemData] = await connection.query('SELECT ITEM_ID FROM item ORDER BY CREATED_AT DESC LIMIT 1');
        const [userItemData] = await connection.query('SELECT USER_ID FROM user LIMIT 1');
        if (itemData.length > 0 && userItemData.length > 0) {
          const userItem = {
            USER_ID: userItemData[0].USER_ID,
            ITEM_ID: itemData[0].ITEM_ID,
            GOT_AT: utils.getCurrentDateTime()
          };
          await connection.query('INSERT INTO user_item SET ?', userItem);
          utils.logInfo('ユーザーアイテムテストデータを挿入しました');
        }
        break;
        
      case 'transaction_history':
        // 取引履歴を作成
        const [transactionItem] = await connection.query('SELECT ITEM_ID FROM item ORDER BY CREATED_AT DESC LIMIT 1');
        const [transactionUser] = await connection.query('SELECT USER_ID FROM user LIMIT 1');
        if (transactionItem.length > 0 && transactionUser.length > 0) {
          const transaction = {
            TRANSACTION_ID: utils.generateUUID(),
            USER_ID: transactionUser[0].USER_ID,
            ITEM_ID: transactionItem[0].ITEM_ID,
            USED_POINT: 100,
            TRANSACTION_AT: utils.getCurrentDateTime()
          };
          await connection.query('INSERT INTO transaction_history SET ?', transaction);
          utils.logInfo('取引履歴テストデータを挿入しました');
        }
        break;
        
      case 'trophy':
        // トロフィーを作成
        const trophy = {
          TROPHY_ID: utils.generateUUID(),
          TROPHY_NAME: 'test_trophy',
          CONDITIONS: 'test_condition',
          RARITY: 1,
          CREATED_AT: utils.getCurrentDateTime()
        };
        await connection.query('INSERT INTO trophy SET ?', trophy);
        utils.logInfo('トロフィーテストデータを挿入しました');
        break;
        
      case 'user_trophy':
        // ユーザーのトロフィー獲得情報を作成
        const [trophyData] = await connection.query('SELECT TROPHY_ID FROM trophy ORDER BY CREATED_AT DESC LIMIT 1');
        const [userTrophyData] = await connection.query('SELECT USER_ID FROM user LIMIT 1');
        if (trophyData.length > 0 && userTrophyData.length > 0) {
          const userTrophy = {
            USER_ID: userTrophyData[0].USER_ID,
            TROPHY_ID: trophyData[0].TROPHY_ID,
            GOT_AT: utils.getCurrentDateTime()
          };
          await connection.query('INSERT INTO user_trophy SET ?', userTrophy);
          utils.logInfo('ユーザートロフィーテストデータを挿入しました');
        }
        break;
    }
  } catch (err) {
    utils.logError(err, `${tableName} テストデータ挿入`);
    throw err;
  }
}

// メイン初期化関数
async function initializeDatabase() {
  let connection;
  try {
    connection = await createConnection();
    await ensureDatabaseExists(connection);
    await createTables(connection);
    utils.logInfo("データベース初期化が正常に完了しました");
    return true;
  } catch (err) {
    utils.logError(err, 'データベース初期化');
    return false;
  } finally {
    if (connection) {
      await connection.end();
      utils.logInfo("データベース接続を終了しました");
    }
  }
}

// 初期化の実行
initializeDatabase();

module.exports = {initializeDatabase};