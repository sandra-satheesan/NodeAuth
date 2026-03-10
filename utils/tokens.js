const jwt=require('jsonwebtoken');
const crypto=require('crypto');
const RefreshToken=require('../models/refreshToken');

const ACCESS_TTL = '15m'; //how long access tokens should remain valid before expiring
const REFRESH_TTL_SEC = 60 * 60 * 24 * 7;

//hashing token and returning token as a hexadecimal string
function hashToken(token){
    //initializes a hash object using the SHA-256 algorithm
    //.update(token) feeds the token into ithe hash object
    //.digest('hex') finalizes the hashing process and returns the computed hash as a hexadecimal string
    return crypto.createHash('sha256').update(token).digest('hex');
}

function createJti(){
    //crypto.randomBytes(16) generates 16 bytes of random data and converts it to character hex string
    return crypto.randomBytes(16).toString('hex');
}

//creates a short lived JWT access token with user id and email
function signAccessToken(user){
    const payload = { 
        id: user._id.toString(), 
        email: user.email
    };
    // a header is created, then payload is attached and header+payload signed using JWT_SECRET and final token string is returned
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: ACCESS_TTL});
}

//creates a long lived token with a jti value. jti lets us rotate and track tokens
function signRefreshToken(user,jti){
    if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('REFRESH_TOKEN_SECRET not configured');
    }
    const payload = {
        id: user._id.toString(),
        jti
    };
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: REFRESH_TTL_SEC});
}

//hashes the refreshtoken and stores metadata like expiry and devce info
async function persistRefreshToken({ user, refreshToken, jti, ip, userAgent}){
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);
    await RefreshToken.create({ user: user._id, tokenHash, jti, expiresAt, ip, userAgent});
}

//writes HTTP-only cookie so the browser sends it to the refresh enpoint automatically
function setRefreshCookie(res, refreshToken){
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/api/auth/refresh',
        maxAge: REFRESH_TTL_SEC * 1000
    });
}

//revokes the ld token, issues a new pair and saves the new record
async function rotateRefreshToken(oldDoc, user, req, res){
    //revoke old
    oldDoc.revokedAt = new Date();
    const newJti = createJti();
    oldDoc.replacedBy = newJti;
    await oldDoc.save();

    // issue new
    const newAccess = signAccessToken(user);
    const newRefresh = signRefreshToken(user, newJti);
    await persistRefreshToken({
        user,
        refreshToken: newRefresh,
        jti: newJti,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || ''
    });
    setRefreshCookie(res, newRefresh);
    return { accessToken: newAccess };
}

module.exports = {
    hashToken,
    createJti,
    signAccessToken,
    signRefreshToken,
    persistRefreshToken,
    setRefreshCookie,
    rotateRefreshToken
};