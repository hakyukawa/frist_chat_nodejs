const auth = require('../middleware/auth');
const friendRepository = require('../repositories/friend_repository');
const utils = require('../utils/utils');

//フレンド情報を取得
const get_firend_info = async (id) => {
  const friend = await friendRepository.get_friendID(id)
  if (!friend) {
    return { status: 404, message: 'フレンドが見つかりません' };
  }

  return {
    status: 200,
    message: "フレンド取得成功",
    friends: friend.map(friend => ({
      //フレンドIDを判定して変数に入れる
      friend_id: friend.user_id_1 != id ? friend.user_id_1 : friend.user_id_2
    }))
  }
}
module.exports = {
  get_firend_info
};