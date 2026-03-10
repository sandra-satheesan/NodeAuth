//now that login returns a token, we will write a small middleware hat checks Authorization header, validates token, and adds the user infor to the request
//thi file i.e. middleware runs before a protected route
//decides whether request is allowed to continue
//either calls next() or blocks with 401
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const [scheme, tokenFromHeader] = authHeader.split(' ');

    //looks for cookie named access_token
    const tokenFromCookie = req.cookies?.access_token;

    const token =
        scheme === 'Bearer' && tokenFromHeader //checks
            ? tokenFromHeader //if true
            : tokenFromCookie; //if false

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        //verifies token with SECRET and returns payload if valid
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //attacing a user to req
        req.user = { id: decoded.id, email: decoded.email };
        //authentication passed, continue to protected routes
        next();
    }
    catch (error) {
        const msg =
            error.name === 'TokenExpiredError'
                ? 'Access token expired'
                : 'Invalid token';
        return res.status(401).json({ message: msg });
    }
}

module.exports = auth;