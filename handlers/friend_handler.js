const { access } = require('fs');
const auth = require('../middleware/auth');
const friend_service = require('../services/friend_service');
const { error } = require('console');

const friendship = async (req, res, next) => {
  const user_id = req.params.id;

  try {
    const result = await friend_service.get_firend_info(user_id);
    //レスポンスデータ
    res.status(result.status).json({
      message: result.message,
      friends: result.friends || [],
      error: result.error || null,
    });
  } catch (error) {
    console.error("Error in friendship handler:", error);
    res.status(500).json({ message: "サーバーエラー", error: error.message });
  }}

module.exports = {
  friendship
}