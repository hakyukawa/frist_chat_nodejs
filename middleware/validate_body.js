const validate_body = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                status: 400,
                message: 'リクエストボディの中身が空です',
            });
        }
    }
    next();
};

module.exports = validate_body;