const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const RefreshToken = require('../models/refreshToken');
const {
    createJti,
    signAccessToken,
    signRefreshToken,
    persistRefreshToken,
    setRefreshCookie
} = require('../utils/tokens');

const router = express.Router();

//Registering User
router.post('/register', async (req, res) => {
    try {
        //get the credentails from req body
        const { username, email, password } = req.body;

        //User.findOne() retrieve a sinle document from the collection that satisfies the condition
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User exists' });

        //bcrypt.hash(password,saltRounds) => generate a hashed password asycnhronously
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User created successful' })
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

//User login and JWT
router.post('/login', async (req, res) => {
    console.log('Entered /login handler with body:', req.body);
    try {
        //take email and password from req body
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid User' });

        //bcrypt.compare(plainpassword,hashedpassword)
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        console.log('Login: user found, creating tokens for user id', user._id && user._id.toString());
        const accessToken = signAccessToken(user);

        const jti = createJti();
        console.log('Login: generated jti', jti);
        const refreshToken = signRefreshToken(user, jti);
        console.log('Login: signed refresh token length', refreshToken && refreshToken.length);

        await persistRefreshToken({
            user,
            refreshToken,
            jti,
            ip: req.ip,
            userAgent: req.headers['user-agent'] || ''
        });
        console.log('Login: persisted refresh token in DB');

        setRefreshCookie(res, refreshToken);
        console.log('Login: set refresh cookie');

        res.json({ accessToken });

        //to create a token, requires header, payload and signature
        //jsonwebtoken automatically creates the header consistin of "alg" and "typ"
        //payload consist of id and email, also jwt adds fields iat and exp automatically
        //const payload = { id: user._id, email: user.email };
        
        //header and payload are combined, JWT_SECRET is used to sign them
        //A JWT is created by encoding the header and payload, then signing them using a secret key to produce a tamper-proof token. 
        //The server later verifies the signature to authenticate the user without storing session data.
        //const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
        //res.json({ token });

    }

    catch (error) {
    res.status(500).json({ message: 'Server error' });
}
});

const {hashToken, rotateRefreshToken} = require('../utils/tokens');

router.post('/refresh', async(req,res) => {
    try {
        const token = req.cookies?.refresh_token;
        if (!token) return res.status(401).json({message: 'No refresh token'});

        let decoded;
        try{
            decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        }catch(err){
            return res.status(401).json({message: 'Invalid or expired refresh token'});
        }

        const tokenHash = hashToken(token);
        const doc = await RefreshToken.findOne({ tokenHash, jti: decoded.jti}).populate('user');

        if (!doc){
            return res.status(401).json({message: 'Refresh token not recognized'});
        }
        if (doc.revokedAt){
            return res.status(401).json({message: 'Refresh token revoked'});
        }
        if (doc.expiresAt < new Date()){
            return res.status(401).json({message: 'Refresh token expired'});
        }

        const result = await rotateRefreshToken( doc, doc.user, req, res);
        return res.json({accessToken: result.accessToken});
    }catch(err){
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});

router.post('/logout',async(req,res) => {
    try{
        const token = req.cookies?.refresh_token;
        if (token){
            const tokenHash = hashToken(token);
            const doc = await RefreshToken.findOne({tokenHash});
            if (doc && !doc.revokedAt){
                doc.revokedAt =  new Date();
                await doc.save();
            }
        }
        res.clearCookie('refresh_token', {path: '/api/auth/refresh'});
        res.json({message: 'Logged out'});
    } catch(err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});

module.exports = router;
