const auth = require('../middleware/auth');
const friendRepository = require('../repositories/friend_repository');
const utils = require('../utils/utils');

//フレンド情報を取得
const get_firend_info = async (id) => {
  try {
    const friends = await friendRepository.get_friendID(id); // フレンド一覧を取得

    if (!friends || friends.length === 0) {
      return { status: 404, message: 'フレンドが見つかりません', friends: [] };
    }

    // 各フレンドの情報を取得
    const friendDetails = await Promise.all(
      friends.map(async (friend) => {
        // フレンドIDを判定して変数に入れる
        const friendInfo = await friendRepository.get_friendInfo(
          friend.user_id_1 !== id ? friend.user_id_1 : friend.user_id_2
        );
        return friendInfo;
      })
    );

    return {
      status: 200,
      message: "フレンド取得成功",
      friends: friendDetails
    };
  } catch (error) {
    console.error("Error in get_firend_info:", error);
    return { status: 500, message: "サーバーエラー", friends: [], error: error.message };
  }
};
//フレンドリクエスト作成
const create_FriendRequest = async (user_id,receiver_id) => {
  const request_id = utils.generateUUID();
  try{
    const friendRequest = await friendRepository.create_FriendRequest(
      request_id,
      user_id,
      receiver_id
    )
    if(!friendRequest) {
      return {
          status: 500,
          message: 'データベースに登録出来ませんでした'
      }
    }
    return{
      status: 200,
      message: 'フレンドリクエスト作成完了',
      server_id: friendRequest.request_id
    }
  }catch (error){
    return {
      status: 500,
      message: `フレンドリクエスト作成中にエラーが発生しました : ${error}`
    }
  }
} 
module.exports = {
  get_firend_info,
  create_FriendRequest,
};