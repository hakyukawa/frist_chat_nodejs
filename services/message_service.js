const message_repository = require('../repositories/message_repository');
const server_repository = require('../repositories/server_repository');
const user_repository = require('../repositories/user_repository');
const utils = require('../utils/utils');

class message_service {
    // メッセージの送信
    async send_message(user_id, channel_id, content) {
        if (!user_id || !channel_id || !content) {
            return {
                status: 400,
                message: 'ボディが不足しています'
            }
        }
        try {
            const response = await message_repository.send_message(user_id, channel_id, content);

            // 送信者の既読状態を更新するために型くを変更
            const updatte_sender_data = {
                "last_read_message_id": response,
                "last_message_id": response,
            }

            //送信者の既読状態を更新
            const update_sender_read_status = await message_repository.update_read_status(updatte_sender_data, user_id, channel_id);

            if (!response) {
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
        if (!user_id || !message_id || !content) {
            return {
                status: 400,
                message: 'ボディが不正です'
            }
        }
        // メッセージの送信者を確認
        const sender_id = await message_repository.get_sender_id(message_id);
        if (!sender_id) {    // メッセージが見つからなかった場合
            return {
                status: 404,
                message: 'メッセージが見つかりません'
            }
        }
        if (sender_id !== user_id) { // メッセージの送信者と編集者が違った場合
            return {
                status: 403,
                message: 'メッセージを編集する権限がありません'
            }
        }
        try {
            const [result] = await message_repository.edit_message(message_id, content);
            if (result.affectedRows === 0) {
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

    async get_message(channel_id, user_id, last_message_id) {
        if (!channel_id) {
            return {
                status: 400,
                message: 'パラメータが不足しています'
            }
        }

        try {
            //最後に読んだメッセージIDを取得
            //メッセージを取得
            const response = await message_repository.get_message(channel_id,last_message_id);
            if (response.length === 0) { //メッセージが存在していないが、取得に失敗していない場合(チャンネル初期状態)
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
            let result;
            if (response.length > 0) {
                // 既読状態を更新
                result = await message_repository.update_read_status(response[0].message_id, response[response.length - 1].message_id, user_id, channel_id);
            }
            return {
                status: 200,
                message: 'メッセージを取得しました',
                data: [
                    response,
                    {
                        last_message_id: response[response.length - 1].message_id
                    }
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
    // 未読件数を更新
    async update_unread_count(channel_id, last_message_id) {
        try {
            const response = await message_repository.update_unread_count(channel_id, last_message_id);
            if (response.affectedRows === 0) {
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
    // 最新のメッセージIDを取得
    async get_last_message(channel_id) {
        try {
            const last_message_id = await message_repository.get_last_message(channel_id);
            return last_message_id;
        } catch (error) {
            return {
                status: 500,
                message: `エラーが発生しました error: ${error}`
            }
        }
    }

    //ポイント付与処理
    async add_point(user_id, channel_id,) {
        try {
            //サーバー検索
            const server = await server_repository.get_server_by_channel(channel_id);
            if (!server) {
                throw new Error('サーバーが見つかりません');
            }

            // 最後に自分が送ったメッセージの次のメッセージを取得
            const unread_first_message = await message_repository.get_unread_first_message(channel_id, user_id);
            if (!unread_first_message) {

                return {
                    message: '自分が送ったメッセージの次のメッセージが見つかりません(連投)',
                    points: 0
                };
            }

            // 現在の時刻を取得
            const current_time = new Date();

            // 日付が変わっているかチェック
            let effective_unread_message = unread_first_message;
            const unread_message_date = new Date(unread_first_message.CREATED_AT);
            const today = new Date(current_time);
            today.setHours(0, 0, 0, 0);

            const unread_date = new Date(unread_message_date);
            unread_date.setHours(0, 0, 0, 0);

            // 日付が違う場合（前日以前のメッセージ）
            if (unread_date.getTime() < today.getTime()) {
                // 前日のEND_ATの時間を計算
                const [end_hours, end_minutes] = server.end_at.split(':').map(Number);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                yesterday.setHours(end_hours, end_minutes, 0, 0);

                // その日（昨日のEND_AT）から現在までの間にユーザーが返信しているかチェック
                const last_reply = await message_repository.get_user_messages_after_time(channel_id, user_id, yesterday);

                if (!last_reply || last_reply.length === 0) {
                    // 前日のEND_AT以降に返信していない場合
                    return {
                        points: 0,
                        message: '前日の返信不要時間帯以降に返信していないため、ポイントは付与されません。'
                    };
                }

                // END_AT以降の最初のメッセージを取得（自分以外のユーザーからのメッセージ）
                const messages_after_end = await message_repository.get_other_user_messages_after_time(channel_id, user_id, yesterday);

                if (messages_after_end && messages_after_end.length > 0) {
                    // 最も古いメッセージを未読の最初のメッセージとして扱う
                    effective_unread_message = messages_after_end[0];
                } else {
                    // END_AT以降のメッセージがない場合
                    return {
                        points: 0,
                        message: '返信不要時間帯以降に他のユーザーからのメッセージがないため、ポイントは付与されません。'
                    };
                }
            }

            // 最新メッセージを取得
            const latest_message = await message_repository.get_latest_message(channel_id);

            if (!latest_message) {
                throw new Error('最新メッセージが見つかりません');
            }

            // 未読メッセージの最初のメッセージの時刻を取得
            const first_unread_time = new Date(effective_unread_message.CREATED_AT);

            // 前回のポイント付与時刻を取得
            const [last_point_award] = await user_repository.get_last_point_award(user_id, channel_id);
            if (last_point_award) {
                const last_award_time = new Date(last_point_award.AWARDED_AT);
                const time_since_last_award = (current_time - last_award_time) / (1000 * 60); // 分単位での経過時間

                // 前回のポイント付与から1分経過していない場合はポイント付与しない
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

            // 基本ポイント（最大値）
            const MAX_POINTS = 100;

            // 返信期限の計算
            // UNTIL_REPLYがHH:MM:SS形式の場合は分に変換
            let REPLY_DEADLINE_MINUTES;
            if (typeof server.UNTIL_REPLY === 'string' && server.until_reply.includes(':')) {
                const [hours, minutes] = server.until_reply.split(':').map(Number);
                REPLY_DEADLINE_MINUTES = hours * 60 + minutes;
            } else {
                REPLY_DEADLINE_MINUTES = parseInt(server.until_reply) || 30; // 数値または30分をデフォルト値
            }

            // 最初の未読メッセージからの経過時間（分単位）
            const minutes_since_first_unread = (current_time - first_unread_time) / (1000 * 60);

            // 返信期限に基づいたポイント計算
            let points = 0;
            if (minutes_since_first_unread <= 1) {
                // 1分以内の返信は最大ポイント
                points = MAX_POINTS;
            } else if (minutes_since_first_unread <= REPLY_DEADLINE_MINUTES) {
                // 返信期限内は時間比例で減少
                points = Math.round(MAX_POINTS * (1 - (minutes_since_first_unread - 1) / (REPLY_DEADLINE_MINUTES - 1)));
            } else {
                // 返信期限を過ぎたら最小ポイント（0ポイント）
                points = 0;
            }

            // コアタイムボーナスの計算
            if (is_core_time) {
                // コアタイムの基準時間（1時間 = 60分）
                const base_core_time = 60;

                // コアタイムの長さに応じたボーナス率を計算
                let bonus_percentage = 100; // 1時間のコアタイムで100%ボーナス

                if (core_time_duration > base_core_time) {
                    // 1時間より長いコアタイムは逆比例的に減少
                    // 例: 2時間なら50%、3時間なら33.3%
                    bonus_percentage = Math.round(100 * (base_core_time / core_time_duration));
                } else if (core_time_duration < base_core_time) {
                    // 1時間未満のコアタイムは比例的に減少
                    bonus_percentage = Math.round(100 * (core_time_duration / base_core_time));
                }

                // ボーナスポイントを計算して加算
                const bonus_points = Math.round(points * (bonus_percentage / 100));
                points += bonus_points;
            }

            const issave = await user_repository.save_points(user_id, points);
            if (issave) {
                // ポイントを記録して返す
                const save_award = await user_repository.save_point_award(utils.generateUUID(), user_id, channel_id, points, utils.getCurrentDateTime());
            }
            return {
                points,
                message: `${points}ポイントが付与されました。`
            };

        } catch (error) {
            console.error('ポイント付与エラー:', error);
            throw error;
        }
    }
}

module.exports = new message_service();