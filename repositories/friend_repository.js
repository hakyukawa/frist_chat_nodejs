const { pathToFileURL } = require('url');
const pool = require('../config/database');
const {Friendship,FriendRequest} = require('../models/Friend');
const utils = require('../utils/utils');

class friend_repository {
  //フレンド情報を取得
  async get_friendID(user_id) {
    try {
      const [rows] = await pool.query('SELECT * FROM friendship WHERE user_id_1 = ? or user_id_2 = ?', [user_id,user_id]);
      // フレンドが見つからない場合
      if (rows.length === 0) {
        return null; 
      }
      //データベースの行を FRIEND モデルのインスタンスに変換
      return rows.map(friendData => new Friendship(
        friendData.USER_ID_1,
        friendData.USER_ID_2,
        friendData.FRIEND_CREATED_AT
      )); 
      } catch (error) {
      throw error;
    }
  }

  //最低限のフレンド情報を取得
  async get_UserMinimumInfo(user_id){
    try{
      const [rows] = await pool.query('SELECT user_id, user_name, icon_url FROM user WHERE user_id = ?', [user_id])
      // ユーザーが見つからない場合
      if (rows.length === 0) {
        return null; 
      }
      const UserData = rows[0];
      //ユーザーIDとアイコンURLのみ返す
      return{
        user_id: UserData.user_id,
        user_name: UserData.user_name,
        icon_url: UserData.icon_url
      }
    }catch (error){
      throw error;
    }
  }

  //フレンドリクエストを作成する
  async create_FriendRequest(request_id,sender_id,recever_id){
    //デフォルトは未認証
    const uncertified = 0;

    try{
      //リクエストID、送信者、受信者、ステータス、リクエスト
      const [result] = await pool.query('INSERT INTO friend_request VALUES (?, ?, ?, ?, ?, ?)',[request_id, sender_id, recever_id, uncertified, utils.getCurrentDateTime(), utils.getCurrentDateTime()])
      if(result.affectedRows === 0){
        return null;
      }
      return request_id;
    }catch(error){
      throw error;
    }
  }

  //クライアントのフレンドリクエスト
  async serch_FriendRequest(user_id){
    try{
      const [rows] = await pool.query('SELECT * FROM friend_request WHERE RECEIVER_ID = ?',[user_id])
      // フレンドリクエストが見つからない場合
      if (rows.length === 0) {
        return null; 
      }
      return rows.map(friendRequestData => new FriendRequest(
        friendRequestData.request_id,
        friendRequestData.sender_id,
        friendRequestData.receiver_id,
        friendRequestData.status,
        friendRequestData.created_at,
        friendRequestData.updated_at
      ));
    }catch(err){
      throw err
    }
  }

  //フレンドリクエストの結果
  async result_FriendRequest(request_id,request_status){
    try{
      const [result] = await pool.query('UPDATE friend')
    }catch(err){
      throw err
    }
  }
  

}

module.exports = new friend_repository();