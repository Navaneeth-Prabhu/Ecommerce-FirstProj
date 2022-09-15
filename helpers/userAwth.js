const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports={
    // usercookieJWTAuth:(req,res,next)=>{
    //     const usertoken = req.cookies.usertoken
    //     try{
    //         const user = jwt.verify(usertoken,process.env.USER_TOKEN_SECRET)
    //         next()
    //     }catch(err){
    //         console.log('error occured in userauth.js')
    //         res.clearCookie('usertoken')
    //         return res.redirect('/users/login')
    //     }
    // },

    userJWTTokenAuth:async function(req, res, next){
        const token = req.cookies.token;
        try{
            const user = jwt.verify(token, process.env.USER_SECRET_KEY);
            console.log(user);
            let userData = await db.get().collection(collections.USER_COLLECTION).findOne({ email: user.email })
            console.log(userData);
            if (userData.blocked == true) {
                res.clearCookie('token');
                res.cookie('blocked',"User blocked")
                res.redirect('/login')
            } else {
                req.user = user;
                next();
            }
        }catch (err){
            res.clearCookie('token');
            return res.redirect('/login')
        }
    },
    
    userLoggedIn:(req,res,next)=>{
        try{
            const usertoken = req.cookies.usertoken
            console.log(usertoken)
            const user = jwt.verify(usertoken,process.env.USER_TOKEN_SECRET)
            res.redirect('/')
        }catch(err){
            res.clearCookie('usertoken')
            next()
        }
    },isBlocked:(req,res,next)=>{
        user_helper.is_blocked()
    },



}