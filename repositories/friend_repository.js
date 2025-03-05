const pool = require('../config/database');
const {Friendship} = require('../models/Friend');

class friend_repository {
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
    }catch{

    }

  }
}

module.exports = new friend_repository();