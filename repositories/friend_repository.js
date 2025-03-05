const { pathToFileURL } = require('url');
const pool = require('../config/database');
const {Friendship} = require('../models/Friend');
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
  async get_friendInfo(friend_id){
    try{
      const [rows] = await pool.query('SELECT user_id,icon_url FROM user WHERE user_id = ?', [friend_id])
      // ユーザーが見つからない場合
      if (rows.length === 0) {
        return null; 
      }
      const friendData = rows[0];
      //ユーザーIDとアイコンURLのみ返す
      return{
        friend_id: friendData.user_id,
        icon_url: friendData.icon_url
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
}

module.exports = new friend_repository();