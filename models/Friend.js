// フレンドモデル
class Friendship {
    constructor(user_id_1, user_id_2, friend_created_at) {
        this.user_id_1 = user_id_1;
        this.user_id_2 = user_id_2;
        this.friend_created_at = friend_created_at;
    }
}

// フレンドリクエスト
class FriendRequest {
    constructor(request_id, sender_id, receiver_id, status, created_at, updated_at) {
        this.request_id = request_id;
        this.sender_id = sender_id;
        this.receiver_id = receiver_id;
        this.status = status || 0;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}