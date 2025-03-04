// 取引履歴
class TransactionHistory {
    constructor(transaction_id, user_id, item_id, used_point, transaction_at) {
        this.transaction_id = transaction_id;
        this.user_id = user_id;
        this.item_id = item_id;
        this.used_point = used_point;
        this.transaction_at = transaction_at;
    }
}