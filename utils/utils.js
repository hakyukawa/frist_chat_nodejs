const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

/**
 * ユーティリティ関数群
 */
const utils = {
  /**
   * エラーロギング
   * @param {Error} error - エラーオブジェクト
   * @param {string} context - エラーが発生したコンテキスト
   */
  logError: (error, context) => {
    const logMessage = `[ERROR] ${context}: ${error.message}\nStack: ${error.stack}\nTimestamp: ${utils.getCurrentDateTime()}\n\n`;

    // コンソールに出力
    console.error(logMessage);

    // ログファイルに記録
    const logFilePath = path.join(__dirname, 'logs', 'error.log');
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Failed to write error log:', err);
      }
    });
  },

  /**
   * 情報ロギング
   * @param {string} message - ログメッセージ
   * @param {string} context - ログのコンテキスト
   */
  logInfo: (message, context) => {
    const logMessage = `[INFO] ${context}: ${message}\nTimestamp: ${utils.getCurrentDateTime()}\n\n`;

    // コンソールに出力
    console.log(logMessage);

    // ログファイルに記録
    const logFilePath = path.join(__dirname, 'logs', 'info.log');
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Failed to write info log:', err);
      }
    });
  },

  /**
   * 時間文字列をMySQLに適したフォーマットに変換
   * @param {string} timeString - HH:MM:SS形式の時間文字列
   * @returns {string} MySQL用の時間文字列
   */
  formatTimeForMySQL: (timeString) => {
    // 時間文字列が正しいフォーマット（HH:MM:SS）かどうかを検証
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(timeString)) {
      throw new Error(`Invalid time format: ${timeString}. Expected HH:MM:SS`);
    }
    return timeString;
  },

  /**
   * 現在の日時をMySQLフォーマット（YYYY-MM-DD HH:MM:SS）で取得
   * @returns {string} MySQL形式の現在日時
   */
  getCurrentDateTime: () => {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000; // タイムゾーンのオフセット（ミリ秒）
    const localDate = new Date(date.getTime() - offset); // ローカルタイム
    return localDate.toISOString().slice(0, 19).replace('T', ' ');
  },

  /**
   * UUIDを生成
   * @returns {string} 生成されたUUID
   */
  generateUUID: () => {
    return uuidv4();
  },

  /**
   * パスワードをハッシュ化
   * @param {string} password - ハッシュ化するパスワード
   * @returns {string} SHA-256ハッシュ値（16進数）
   */
  hashPassword: (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
  },

  /**
   * パスワードの検証
   * @param {string} inputPassword - 入力されたパスワード
   * @param {string} hashedPassword - ハッシュ化されたパスワード
   * @returns {boolean} パスワードが一致すればtrue
   */
  verifyPassword: (inputPassword, hashedPassword) => {
    const inputHash = crypto.createHash('sha256').update(inputPassword).digest('hex');
    return inputHash === hashedPassword;
  },

  /**
   * レスポンスオブジェクトの作成
   * @param {boolean} success - 処理の成功/失敗
   * @param {string} message - レスポンスメッセージ
   * @param {Object} [data=null] - レスポンスデータ
   * @returns {Object} 整形されたレスポンスオブジェクト
   */
  createResponse: (success, message, data = null) => {
    return {
      success,
      message,
      data,
      timestamp: utils.getCurrentDateTime()
    };
  },

  /**
   * エラーレスポンスオブジェクトの作成
   * @param {string} message - エラーメッセージ 
   * @param {number} [statusCode=500] - HTTPステータスコード
   * @returns {Object} 整形されたエラーレスポンスオブジェクト
   */
  createErrorResponse: (message, statusCode = 500) => {
    return {
      success: false,
      message,
      statusCode,
      timestamp: utils.getCurrentDateTime()
    };
  },

  /**
   * オブジェクトのキーをキャメルケースからスネークケース（大文字）に変換
   * @param {Object} obj - 変換するオブジェクト
   * @returns {Object} キーがスネークケース（大文字）に変換されたオブジェクト
   */
  toDatabaseFormat: (obj) => {
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // キャメルケースをスネークケース（大文字）に変換
        const dbKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
        result[dbKey] = obj[key];
      }
    }
    return result;
  },

  /**
   * オブジェクトのキーをスネークケース（大文字）からキャメルケースに変換
   * @param {Object} obj - 変換するオブジェクト 
   * @returns {Object} キーがキャメルケースに変換されたオブジェクト
   */
  toModelFormat: (obj) => {
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // スネークケース（大文字）をキャメルケースに変換
        const modelKey = key.toLowerCase().replace(/_([a-z])/g, (m, p1) => p1.toUpperCase());
        result[modelKey] = obj[key];
      }
    }
    return result;
  },
  
  /**
   * 配列内のオブジェクトをキャメルケースに変換
   * @param {Array} arr - 変換するオブジェクトの配列
   * @returns {Array} 変換された配列
   */
  arrayToModelFormat: (arr) => {
    return arr.map(obj => utils.toModelFormat(obj));
  },

  /**
   * オブジェクトが空かどうかチェック
   * @param {Object} obj - チェックするオブジェクト
   * @returns {boolean} オブジェクトが空の場合はtrue
   */
  isEmptyObject: (obj) => {
    return Object.keys(obj).length === 0;
  },

  /**
   * 指定された文字列が有効なメールアドレス形式かどうかを検証
   * @param {string} email - 検証するメールアドレス
   * @returns {boolean} 有効なメールアドレスならtrue
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * 指定されたフィールドがオブジェクトに存在するか検証
   * @param {Object} obj - 検証するオブジェクト
   * @param {Array} requiredFields - 必須フィールドの配列
   * @returns {Array} 見つからなかったフィールドの配列
   */
  validateRequiredFields: (obj, requiredFields) => {
    const missingFields = [];
    for (const field of requiredFields) {
      if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
        missingFields.push(field);
      }
    }
    return missingFields;
  },

  /**
   * サーバーの稼働日（曜日ビット）を人間が読める形式に変換
   * @param {number} weeksBits - 曜日を表すビット値 (例: 0b1001001)
   * @returns {Array} 稼働曜日の配列 ['月', '木', '日']
   */
  getActiveDaysFromBits: (weeksBits) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const activeDays = [];
    for (let i = 0; i < 7; i++) {
      if ((weeksBits & (1 << i)) !== 0) {
        activeDays.push(days[i]);
      }
    }
    return activeDays;
  },

  /**
   * 曜日の配列からビット表現を生成
   * @param {Array} daysArray - 曜日の配列 (例: ['日', '月', '木'])
   * @returns {number} 曜日のビット表現
   */
  getBitsFromActiveDays: (daysArray) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    let bits = 0;
    for (const day of daysArray) {
      const index = days.indexOf(day);
      if (index !== -1) {
        bits |= (1 << index);
      }
    }
    return bits;
  }
};

module.exports = utils;