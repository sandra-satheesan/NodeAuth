//returns current user
const express=require('express'); //to create router
const auth = require('../middleware/auth'); //authentication middleware, else routes are public
const User = require('../models/user');

const router=express.Router();

router.get('/me', auth, async(req,res)=>{
    try{
        //returns user ID from token excluding password
    const user= await User.findById(req.user.id).select('-password');
    if (!user){
        return res.status(404).json({message: 'User not found'});
    }
    res.json({user});
    }
    catch(error){
        res.status(500).json({messae: 'Server error'});
    }
});

module.exports = router;
