const { access } = require('fs');
const auth = require('../middleware/auth');
const user_service = require('../services/user_service');

const login = async (req, res, next) => {
    const { user_id, password } = req.body;
    const result = await user_service.login(user_id, password);

    res.status(result.status).json({
        message: result.message,
        access_token: result.access_token || null,
        refresh_token: result.refresh_token || null,
        user_id: result.user_id || null,
        error: result.error || null,
    });
}

module.exports = {
    login
}