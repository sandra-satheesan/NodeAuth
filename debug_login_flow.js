require('dotenv').config();
const dns = require("node:dns").promises;
require('dotenv').config();

// mimic server DNS setup for mongodb+srv
 dns.setServers(["1.1.1.1"]);

const connectDB = require('./config/db');
const User = require('./models/user');
const { createJti, signAccessToken, signRefreshToken, persistRefreshToken } = require('./utils/tokens');

console.log('REFRESH_TOKEN_SECRET is', process.env.REFRESH_TOKEN_SECRET);

(async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'test@example.com' });
    console.log('Found user:', !!user, user && user._id.toString());
    if (!user) return;
    const access = signAccessToken(user);
    console.log('Access token length', access.length);
    const jti = createJti();
    console.log('JTI', jti);
    const refresh = signRefreshToken(user, jti);
    console.log('Refresh token length', refresh && refresh.length);
    await persistRefreshToken({ user, refreshToken: refresh, jti, ip: '127.0.0.1', userAgent: 'debug' });
    console.log('Persisted refresh token successfully');
  } catch (err) {
    console.error('Debug error', err);
  } finally {
    process.exit(0);
  }
})();
