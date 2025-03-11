// ユーザー
class User {
    constructor(user_id, user_name, mail, password, icon_url, user_rank, point, created_at) {
        this.user_id = user_id;
        this.user_name = user_name;
        this.mail = mail;
        this.password = password;
        this.icon_url = icon_url;
        this.item_id = item_id;
        this.user_rank = user_rank;
        this.point = point;
        this.created_at = created_at;
    }
}

module.exports = User;