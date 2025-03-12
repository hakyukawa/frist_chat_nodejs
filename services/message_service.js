const message_repository = require('../repositories/message_repository');
const server_repository = require('../repositories/server_repository');
const user_repository = require('../repositories/user_repository');
const utils = require('../utils/utils');

class message_service {
    // メッセージの送信
    async send_message(user_id, channel_id, content) {
        if(!user_id || !channel_id || !content) {
            return {
                status: 400,
                message: 'ボディが不足しています'
            }
        }
        try {
            const response = await message_repository.send_message(user_id, channel_id, content);
            if(!response) {
                return {
                    status: 500,
                    message: 'メッセージの送信に失敗しました'
                }
            }
            return {
                status: 200,
                message: 'メッセージを送信しました',
                data: response
            }
        } catch (error) {
            return {
                status: 500,
                message: `エラーが発生しました error: ${error}`
            }
        }
    }

    // メッセージの編集
    async edit_message(user_id, message_id, content) {
        if(!user_id || !message_id || !content) {
            return {
                status: 400,
                message: 'ボディが不正です'
            }
        }
        // メッセージの送信者を確認
        const sender_id = await message_repository.get_sender_id(message_id);
        if(!sender_id) {    // メッセージが見つからなかった場合
            return {
                status: 404,
                message: 'メッセージが見つかりません'
            }
        }
        if(sender_id !== user_id) { // メッセージの送信者と編集者が違った場合
            return {
                status: 403,
                message: 'メッセージを編集する権限がありません'
            }
        }
        try {
            const [result] = await message_repository.edit_message(message_id, content);
            if(result.affectedRows === 0) {
                return {
                    status: 500,
                    message: 'メッセージの編集に失敗しました'
                }
            }
            return {
                status: 200,
                message: 'メッセージを編集しました'
            }
        } catch (error) {
            return {
                status: 500,
                message: `エラーが発生しました error: ${error}`
            }
        }
    }

    async get_message(channel_id, user_id) {
        if(!channel_id) {
            return {
                status: 400,
                message: 'パラメータが不足しています'
            }
        }

        try {
            //最後に読んだメッセージIDを取得
            const last_message_id = await message_repository.get_last_read_message_id(channel_id, user_id);

            //メッセージを取得
            const response = await message_repository.get_message(channel_id, last_message_id);
            if(response.length === 0) { //メッセージが存在していないが、取得に失敗していない場合(チャンネル初期状態)
                return {
                    status: 200,
                    message: 'メッセージがありませんが取得には成功しています'
                }
            } else if (!response) {
                return {
                    status: 500,
                    message: 'メッセージの取得に失敗しました'
                }
            }
            //既読状態を取得
            const unread_status = await message_repository.get_unread_status(user_id, channel_id);
            let result = null;
            if(response.length > 0) {
                unread_status.last_read_message_id = response[0].message_id;
                unread_status.last_message_id = response[response.length - 1].message_id;
                unread_status.unread_count = 0;
                // 既読状態を更新
                result = await message_repository.update_read_status(unread_status, user_id, channel_id);
            }
            return {
                status: 200,
                message: 'メッセージを取得しました',
                data: [
                    response,
                    unread_status
                ]
            }
        } catch (error) {
            console.error(error);
            return {
                status: 500,
                message: `error: ${error}`
            }
        }
    }

    async update_unread_count(channel_id, last_message_id) {
        try {
            const response = await message_repository.update_unread_count(channel_id, last_message_id);
            if(response.affectedRows === 0) {
                return {
                    status: 404,
                    message: 'チャンネルが見つかりません'
                }
            }
            return {
                status: 200,
                message: '既読状態を更新しました',
                data: channel_id
            }
        } catch (error) {
            return {
                status: 500,
                message: `エラーが発生しました error: ${error}`
            }
        }
        
    }

    async get_last_message(channel_id) {
        try {
            const query = `
                SELECT message_id, created_at
                FROM messages
                WHERE channel_id = ?
                ORDER BY created_at DESC
                LIMIT 1
            `;
            const [rows] = await pool.query(query, [channel_id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('最新メッセージの取得エラー:', error);
            throw error;
        }
    }

    //ポイント付与処理
    async add_point(user_id, channel_id) {
        try {
            //サーバー検索
            const server = await server_repository.get_server_by_channel(channel_id);
            if(!server) {
                throw new Error('サーバーが見つかりません');
            }
            
            // 最新のメッセージの取得（現在投稿したメッセージ）
            const [latest_message] = await message_repository.get_latest_message_by_channel(channel_id);
            if (!latest_message) {
                throw new Error('最新のメッセージが見つかりません');
            }
    
            // 現在の時刻を取得（最新メッセージの投稿時間として使用）
            const current_time = new Date();
            const latest_message_time = new Date(latest_message.CREATED_AT);
            
            // 前回のポイント付与時刻を取得
            const [last_point_award] = await user_repository.get_last_point_award(user_id, channel_id);
            if (last_point_award) {
                const last_award_time = new Date(last_point_award.AWARDED_AT);
                const time_since_last_award = (current_time - last_award_time) / (1000 * 60); // 分単位での経過時間
                
                // 1分経過していない場合はポイント付与しない
                if (time_since_last_award < 1) {
                    console.log("一分経過していない");
                    return {
                        points: 0,
                        message: "前回のポイント付与から1分経過していないため、ポイントは付与されません。"
                    };
                }
            }
    
            // 現在時刻がコアタイム内かチェック
            const current_hours = current_time.getHours();
            const current_minutes = current_time.getMinutes();
            const current_time_value = current_hours * 60 + current_minutes; // 分単位
    
            const [start_core_hours, start_core_minutes] = server.start_core_time.split(':').map(Number);
            const [end_core_hours, end_core_minutes] = server.end_core_time.split(':').map(Number);
    
            const start_core_time_value = start_core_hours * 60 + start_core_minutes;
            const end_core_time_value = end_core_hours * 60 + end_core_minutes;
            
            const is_core_time = current_time_value >= start_core_time_value && current_time_value <= end_core_time_value;
            
            // 返信不要時間帯のチェック
            const [start_no_reply_hours, start_no_reply_minutes] = server.start_at.split(':').map(Number);
            const [end_no_reply_hours, end_no_reply_minutes] = server.end_at.split(':').map(Number);
            
            const start_no_reply_value = start_no_reply_hours * 60 + start_no_reply_minutes;
            const end_no_reply_value = end_no_reply_hours * 60 + end_no_reply_minutes;
            
            // 返信不要時間帯の判定（時間をまたぐケースを考慮）
            let is_no_reply_time = false;
            if (start_no_reply_value > end_no_reply_value) {
                // 夜から朝にかけての時間帯（例: 18:00〜09:00）
                is_no_reply_time = current_time_value >= start_no_reply_value || current_time_value <= end_no_reply_value;
            } else {
                // 通常の時間帯（例: 01:00〜06:00）
                is_no_reply_time = current_time_value >= start_no_reply_value && current_time_value <= end_no_reply_value;
            }
            
            // 返信不要時間帯の場合はポイント加算なし
            if (is_no_reply_time) {
                return {
                    points: 0,
                    message: "返信不要時間帯のため、ポイントは加算されません。"
                };
            }
            
            // コアタイムの長さを計算（分単位）
            const core_time_duration = end_core_time_value - start_core_time_value;
            
            // 基本ポイント（メッセージ投稿ごとの固定ポイント）
            let points = 100;
            
            // コアタイムボーナスの計算
            if (is_core_time) {
                // コアタイムの基準時間（1時間 = 60分）
                const base_core_time = 60;
                // 最大コアタイム（3時間 = 180分）
                const max_core_time = 180;
                
                // コアタイム長と基準時間の比率を計算
                let core_time_ratio = core_time_duration / base_core_time;
                
                // コアタイムが長くなるほどボーナス割合が減少する計算
                // 1時間のコアタイムで100%ボーナス
                // 3時間のコアタイムで33.3%ボーナス
                let bonus_percentage = 100 / core_time_ratio;
                
                // コアタイムが短すぎる場合（1時間未満）は比例的に減少
                if (core_time_duration < base_core_time) {
                    bonus_percentage = 100 * (core_time_duration / base_core_time);
                }
                
                // 最大コアタイムを超えた場合は最小値を適用
                if (core_time_duration > max_core_time) {
                    bonus_percentage = 100 / (max_core_time / base_core_time);
                }
                
                // ボーナスポイントを計算して加算（小数点以下四捨五入）
                const bonus_points = Math.round(points * (bonus_percentage / 100));
                points += bonus_points;
            }
            
            // ポイントをデータベースに保存
            const user_point = await user_repository.save_points(user_id, points);
            
            let award_result = false;
            //DBに保存できたら
            if(user_point){
                // ポイント付与履歴を保存
                award_result = await user_repository.save_point_award(utils.generateUUID(), user_id, channel_id, points, utils.getCurrentDateTime());
            }
    
            if(award_result){
                return {
                    points: points,
                    message: "ポイントを付与しました"
                };
            }
            return {};
    
        } catch (error) {
            return error;
        }
    }
}

module.exports = new message_service();