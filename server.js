require('dotenv').config();

// ensure required secrets are present early
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment');
    process.exit(1);
}
if (!process.env.REFRESH_TOKEN_SECRET) {
    console.error('REFRESH_TOKEN_SECRET is not defined in environment');
    process.exit(1);
}

const dns=require("node:dns").promises;
const connectDB = require('./config/db');
const express=require('express');
const app=express();
app.use(express.json());
const cookieParser=require('cookie-parser');
app.use(cookieParser());
// simple request logger for debugging
app.use((req, res, next) => {
    console.log('Incoming request', req.method, req.path);
    next();
});
const authRoutes = require('./routes/auth');
app.use('/api/auth',authRoutes);
const profileRoutes = require('./routes/profile');
app.use('/api/profile',profileRoutes);

dns.setServers(["1.1.1.1"]);
connectDB();

app.get('/',(req,res)=>{
    res.send('JWT Auth API running')
});

const PORT=process.env.PORT || 5000;
app.listen(PORT,()=> console.log(`Server running o PORT ${PORT}`));
