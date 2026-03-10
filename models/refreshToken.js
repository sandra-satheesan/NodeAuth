const mongoose=require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    //user links refreshToken to a user, reference is User collection, 
    user: { type:mongoose.Schema.Types.ObjectId, ref: 'User', index: true},
    //stores a hash of refresh token
    tokenHash: {type:String, required: true, unique:true},
    //jwt id -> unique identifier for the token
    jti: {type: String, required: true, index: true},
    expiresAt: {type: Date, required: true, index:true},
    //used when user logs out, token reuser detected, and when security event occcurs
    revokedAt: {type: Date, default: null},
    //replaced by jti of new fresh token
    replacedBy: {type: String, default: null},
    //when token was issued
    createdAt: {type: Date, default: Date.now},
    //ip address of client that requested token
    ip: String,
    //browser/device info
    userAgent: String
});

module.exports =  mongoose.model('RefreshToken',refreshTokenSchema );