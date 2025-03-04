// メッセージ
class Message {
    constructor(message_id, channel_id, sender_id, content, edited_at, created_at) {
        this.message_id = message_id;
        this.channel_id = channel_id;
        this.sender_id = sender_id;
        this.content = content;
        this.edited_at = edited_at;
        this.created_at = created_at;
    }
}

// 既読、未読
class ReadStatus {
    constructor(channel_id, user_id, last_read_message_id, last_message_id, unread_count, last_viewed_at, last_updated_id) {
        this.channel_id = channel_id;
        this.user_id = user_id;
        this.last_read_message_id = last_read_message_id;
        this.last_message_id = last_message_id;
        this.unread_count = unread_count || 0;
        this.last_viewed_at = last_viewed_at;
        this.last_updated_id = last_updated_id;
    }
}