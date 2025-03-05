const { access } = require('fs');
const auth = require('../middleware/auth');
const friend_service = require('../services/friend_service');
const { error } = require('console');

//フレンド取得
const friendship = async (req, res, next) => {
  const user_id = req.user_id;

  try {
    const result = await friend_service.get_firend_info(user_id);
    //レスポンスデータ
    res.status(result.status).json({
      status: result.status,
      message: result.message,
      friends: result.friends || [],
      error: result.error || null,
    });
  } catch (error) {
    console.error("Error in friendship handler:", error);
    res.status(500).json({ message: "サーバーエラー", error: error.message });
  }
}

//フレンドリクエスト
const friendrequest = async (req, res, next) => {
  const user_id = req.user_id;
  const receiver_id = req.params.receiver_id

  const result = await friend_service.create_FriendRequest(user_id,receiver_id)
  res.status(result.status).json(result)
}


module.exports = {
  friendship,
  friendrequest
}