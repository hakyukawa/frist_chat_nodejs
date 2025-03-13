const e = require('cors');
const auth = require('../middleware/auth');
const userRepository = require('../repositories/user_repository');
const utils = require('../utils/utils');
const user_repository = require('../repositories/user_repository');
const server_repository = require('../repositories/server_repository');

const login = async (id, password) => {
    const user = await userRepository.get_user_byID(id);
    if (!user) {
        return { status: 400, message: 'ユーザーが見つかりません' };
    }
    const user_password = await userRepository.get_user_password(id);
    const is_password_valid = utils.verifyPassword(password, user_password);
    if (!is_password_valid) {
        return { status: 401, message: 'ユーザーIDまたはパスワードが違います' };
    }
    const access_token = auth.generate_access_token(user.user_id);
    const refresh_token = auth.generate_refresh_token({userId: user.user_id});
    return {
        status: 200,
        message: 'ログイン成功',
        access_token,
        refresh_token,
        user_id: user.user_id,
    };
};

const signup = async (id, username, mail, password) => {
    // ユーザーの有無
    const signup_user = await userRepository.get_user_byID(id);
    if (signup_user) {
        return { status: 401, message: '存在するユーザーIDです'};
    }
    const all_users = await user_repository.get_all_user();
    // 全ユーザーのメールと比較
    const isDuplicate = all_users.some(user => user.mail === mail);
    if (isDuplicate) {
        return { status: 409, message: 'このメールアドレスはすでに存在します' }
    }
    // パスワードのハッシュ化
    const hashedPassword = utils.hashPassword(password);
    if (hashedPassword)  {
        await userRepository.resister(id, username, mail, hashedPassword, 0, 0, utils.getCurrentDateTime());
    }
    return {
        status: 200,
        message: 'サインアップ成功',
    };
}

const get_profile = async (user_id) => {
    // ユーザーが存在しているか
    const exiting_uer = await userRepository.get_user_byID(user_id);
    if (!exiting_uer) {
        return { status: 404, message: '存在しないユーザーです'};
    }

    const user_profile = await userRepository.get_user_profile(user_id);

    return {
        status: 200,
        message: 'ユーザー情報取得成功',
        user_id: user_profile.user_id,
        user_name: user_profile.user_name,
        icon_url: user_profile.icon_url,
        item_id: user_profile.item_id,
        user_rank: user_profile.user_rank,
        user_point: user_profile.point,
    }
}
const createChannel = async (channel_id, server_id, channel_name) => {
    //  チャンネル作成情報の代入
    const channel = await userRepository.add_channel(channel_id, server_id, channel_name, utils.getCurrentDateTime());
    // サーバー所属メンバー取得
    const members = await server_repository.get_server_members(server_id);
    // サーバーメンバーをリードステータスに追加
    const insert_read  = await Promise.all(
        members.map((member) => 
            user_repository.insert_readstatus(
                member.user_id, channel_id, null, null, 0, utils.getCurrentDateTime(), utils.getCurrentDateTime()
            )
        )
    );
    if (insert_read === null) {
        return {
            status: 500,
            message: 'リードステータスにメンバーを追加出来ませんでした'
        }
    }
    return {
        status: 200,
        message: 'チャンネルが正常に追加されました',
        channel_id: channel.channel_id,
        channel_name: channel.channel_name,
    }
}

const get_items = async (user_id) => {
    
    const items = await userRepository.get_user_items(user_id);

    if (!items || items.length === 0) {
        return { status: 404, message: 'アイテムが見つかりません', items: [] };
    }

    return {
        status: 200, 
        message: 'ユーザー保有アイテム取得成功',
        items: items,
    }
}

const update_profile = async (user_id, user_name, icon_url) => {
    const exiting_uer = await user_repository.get_user_byID(user_id);
    if (!exiting_uer) {
        return { status: 404, message: '存在しないユーザーです' };
    }

    const updateProfile = await user_repository.update_user_profile(user_id, user_name, icon_url);

    return {
        status: 200,
        message: 'ユーザー情報の更新に成功しました',
        update_info: updateProfile,
    }
}

const update_user_mail = async (user_id, mail) => {
    try {
        
        const exiting_uer = await user_repository.get_user_byID(user_id);
        if (!exiting_uer) {
            return { status: 404, message: "ユーザーが見つかりません" };
        }
        const all_users = await user_repository.get_all_user();
    
        // 全ユーザーのメールと比較
        const isDuplicate = all_users.some(user => user.mail === mail);
        if (isDuplicate) {
            return { status: 409, message: 'このメールアドレスはすでに存在します' }
        }
    
        // console.log(mail);
        // メールアドレスを更新
        const updateMail = await user_repository.update_user_mail(user_id, mail);
        return { 
            status: 200,
            message: 'メールアドレスを更新しました',
            update_count: updateMail,
        }
    } catch (err) {
        return { status: 500, message: "サーバーエラーが発生しました" };
    }
}

module.exports = {
    login,
    signup,
    get_profile,
    createChannel,
    get_items,
    update_profile,
    update_user_mail,
};