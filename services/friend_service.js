const { friendrequest } = require('../handlers/friend_handler');
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
    const userMinimumDetails = await Promise.all(
      friends.map(async (friend) => {
        // フレンドIDを判定して変数に入れる
        const userMinimumInfo = await friendRepository.get_UserMinimumInfo(
          friend.user_id_1 !== id ? friend.user_id_1 : friend.user_id_2
        );
        return userMinimumInfo;
      })
    );

    return {
      status: 200,
      message: "フレンド取得成功",
      users: userMinimumDetails
    };
  } catch (error) {
    console.error("Error in get_firend_info:", error);
    return { status: 500, message: "サーバーエラー", friends: [], error: error.message };
  }
};

//フレンドリクエスト作成
const create_FriendRequest = async (user_id, receiver_id) => {
  const request_id = utils.generateUUID();
  try {
    const friendRequest = await friendRepository.create_FriendRequest(
      request_id,
      user_id,
      receiver_id
    )
    if (!friendRequest) {
      return {
        status: 500,
        message: 'データベースに登録出来ませんでした'
      }
    }
    //すでにフレンドだった場合
    if(friendRequest == "Already friends"){
      return {
        status: 409,
        message: 'フレンドになっています'
      }
    }

    //未承認のフレンドリクエスtが存在する場合
    if(friendRequest == "Already exists"){
      return {
        status: 409,
        message: '未承認フレンドリクエスト存在します'
      }
    }
    //成功
    return {
      status: 200,
      message: 'フレンドリクエスト作成完了',
      server_id: friendRequest.request_id
    }
  } catch (error) {
    return {
      status: 500,
      message: `フレンドリクエスト作成中にエラーが発生しました : ${error}`
    }
  }
}

//クライアントのフレンドリクエストを取得する
const get_FrinedRequest = async (user_id) => {
  try {
    //未承認のフレンドリクエストを取得
    const friendRequests = await friendRepository.serch_FriendRequest(user_id); // フレンドリクエストを取得
    // フレンドリクエストの送り主情報を取得
    const senderDetails = await Promise.all(
      friendRequests.map(async (friendRequest) => {
        const sender_Info = await friendRepository.get_UserMinimumInfo(friendRequest.sender_id);
        return sender_Info;
      })
    );
    if(friendRequests !== null){
      return {
        status: 200,
        message: "フレンドリクエスト取得成功",
        friend_requests: senderDetails.map(user => ({
            ...user,
            REQUEST_ID: friendRequests[0].request_id // ここでreceiver_idを追加
        })),
        error: null
      };
    }else{
      return {
        status: 404,
        message: "フレンドリクエストがありません",
        users: null
      };
    }
  } catch (error) {
    console.error("Error in get_firend_info:", error);
    return { status: 500, message: "サーバーエラー", friends: [], error: error.message };
  }
}

//フレンドリクエストを更新するしょり
const response_FriendRequest = async (request_id,friendReq_Status) => {
  try{
    const update_FriendRequest = await friendRepository.update_FriendRequest(request_id,friendReq_Status);
    if (!update_FriendRequest) {
      return {
        status: 500,
        message: 'データベースを更新出来ませんでした'
      }
    }

    return {
      status: 200,
      message: 'フレンドリクエストのステータスを更新しました',
      request_id: update_FriendRequest.request_id
    }
  }catch(error){
    console.error("Error in get_firend_info:", error);
    return { status: 500, message: `フレンドリクエスト更新中にエラーが発生しました${error}`};
  }
}

module.exports = {
  get_firend_info,
  create_FriendRequest,
  get_FrinedRequest,
  response_FriendRequest
};