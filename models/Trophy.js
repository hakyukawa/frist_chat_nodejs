// トロフィー
class Trophy {
    constructor(trophy_id, trophy_name, conditions, rarity, created_at) {
        this.trophy_id = trophy_id;
        this.trophy_name = trophy_name;
        this.conditions = conditions;
        this.rarity = rarity;
        this.created_at = created_at;
    }
}

// ユーザー保有トロフィー
class UserTrophy {
    constructor(user_id, trophy_id, got_at) {
        this.user_id = user_id;
        this.trophy_id = trophy_id;
        this.got_at = got_at;
    }
}