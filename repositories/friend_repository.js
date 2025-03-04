const pool = require('../config/database');
const {Friendship} = require('../models/Friend');

class friend_repository {
  async get_friendID(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM friendship WHERE user_id_1 = ? or user_id_2 = ?', [id,id]);
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
}

module.exports = new friend_repository();