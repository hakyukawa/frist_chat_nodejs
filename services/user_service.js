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

module.exports = {
    login,
    signup,
    get_profile,
};