const e = require('cors');
const auth = require('../middleware/auth');
const userRepository = require('../repositories/user_repository');
const utils = require('../utils/utils');

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
        return { status: 401, message: '存在しないユーザーです'};
    }

    const user_profile = await userRepository.get_user_profile(user_id);

    return {
        status: 200,
        message: 'ユーザー情報取得成功',
        user_id: user_profile.user_id,
        user_name: user_profile.user_name,
        icon_url: user_profile.icon_url,
        user_rank: user_profile.user_rank,
        user_point: user_profile.point,
    }
}
const createChannel = async (channel_id, server_id, channel_name) => {
    //  チャンネル追加情報の代入
    const channel = await userRepository.add_channel(channel_id, server_id, channel_name, utils.getCurrentDateTime());

    return {
        status: 200,
        message: 'チャンネルが正常に追加されました',
        channel_id: channel.channel_id,
        channel_name: channel.channel_name,
    }
}

const get_items = async (user_id) => {
    const exiting_uer = await userRepository.get_user_byID(user_id);
    if (!exiting_uer) {
        return { status: 401, message: '存在しないユーザーです'};
    }
    const items = await userRepository.get_user_items(user_id);

    if (!items || items.length === 0) {
        return { status: 404, message: 'アイテムが見つかりません', items: [] };
    }

    return {
        status: 200, 
        message: 'ユーザー保有アイテム取得成功',
        item_id: items.map(item => item.item_id),
        item_name: items.map(item => item.item_name),
        image_url: items.map(item => item.image_url),
    }
}

module.exports = {
    login,
    signup,
    get_profile,
    createChannel,
    get_items,
};