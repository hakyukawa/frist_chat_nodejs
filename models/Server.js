// サーバー
class Server {
    constructor(server_id, owner_id, server_name, icon_url, until_reply, start_at, end_at, weeks, start_core_time, end_core_time, created_at) {
        this.server_id = server_id;
        this.owner_id = owner_id;
        this.server_name = server_name;
        this.icon_url = icon_url;
        this.until_reply = until_reply;
        this.start_at = start_at;
        this.end_at = end_at;
        this.weeks = weeks || '0000000';
        this.start_core_time = start_core_time;
        this.end_core_time = end_core_time;
        this.created_at = created_at;
    }
}

// サーバー所属ユーザー
class ServerUser {
    constructor(server_id, user_id, is_muted, last_activity, joined_at) {
        this.server_id = server_id;
        this.user_id = user_id;
        this.is_muted = is_muted || false;
        this.last_activity = last_activity;
        this.joined_at = joined_at;
    }
}

module.exports = {
    Server,
    ServerUser,
}