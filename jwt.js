const jwt = require('jsonwebtoken')

adminCookieJWTAuth:function adminCookieJwtAuth (req, res, next){
    const admintoken = req.cookies.admintoken;
    console.log(admintoken);
    try{
      const admin = jwt.verify(admintoken, process.env.ADMIN_TOKEN_SECRET);
      console.log(admin);
      req.admin = admin;
    //   console.log("in next"); 
      next();
    }catch(err) {
      console.log("in error");
      res.clearCookie("admintoken");
      return res.redirect('/users/login')
    }
}