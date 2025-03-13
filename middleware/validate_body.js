const validate_body = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        if (!req.body || Object.keys(req.body).length === 0) {
            // URLをパスセグメントに分割
            const pathSegments = req.url.split('/').filter(segment => segment);

            // 特定のパスパターンをチェック（例：auth/user/friendrequest/何か）
            if (pathSegments.length >= 3 &&
                pathSegments[0] === 'auth' &&
                pathSegments[1] === 'user' &&
                pathSegments[2] === 'friendrequest') {
                return next();
            }
            return res.status(400).json({
                status: 400,
                message: 'リクエストボディの中身が空です',
            });
        }
    }
    next();
};

module.exports = validate_body;