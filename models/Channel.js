// チャンネル
class Channel {
    constructor(channel_id, server_id, channel_name, created_at) {
        this.channel_id = channel_id;
        this.server_id = server_id;
        this.channel_name = channel_name;
        this.created_at = created_at;
    }
}

module.exports = {
    Channel,
}