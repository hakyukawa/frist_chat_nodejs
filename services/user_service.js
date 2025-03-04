const auth = require('../middleware/auth');
const userRepository = require('../repositories/user_repository');
const utils = require('../utils/utils');

const login = async (id, password) => {
    const user = await userRepository.get_user_byID(id);
    if (!user) {
        return { status: 404, message: 'ユーザーが見つかりません' };
    }
    const user_password = await userRepository.get_user_password(id);
    const is_password_valid = utils.verifyPassword(password, user_password);
    if (!is_password_valid) {
        return { status: 401, message: 'ユーザーIDまたはパスワードが違います' };
    }
    const access_token = auth.generate_access_token(user.id);
    const refresh_token = auth.generate_refresh_token({userId: user.id});
    return {
        status: 200,
        message: 'ログイン成功',
        access_token,
        refresh_token,
        user_id: user.id,
    };
};

module.exports = {
    login
};