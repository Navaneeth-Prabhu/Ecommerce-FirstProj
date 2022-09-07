var express = require('express');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const jwt = require('jsonwebtoken')
var auth = require('../helpers/jwt')
require('dotenv').config()
var userHelper = require('../helpers/user-helpers')
var productHelper = require('../helpers/product-helpers')
var categoryHelper = require('../helpers/category-helpers')
var addUserError=require('../routes/user');
const { query, response } = require('express');
console.log("here 2")

/* GET users listing. */
router.get('/',auth.adminCookieJWTAuth, function(req, res, next) {
  // console.log(req.session.adminLoggedIn);
  
    userHelpers.getAllUsers().then((users) => {
      console.log(users);
      res.render('admin/dashboard', {admin: true,users, adminLoggedIn:req.session.adminLoggedIn});
      
    })
    console.log("here admin")

});

router.get('/login',auth.adminLoggedIn, function(req,res) {
  if(req.session.adminLoggedIn){
    res.redirect('/admin')
  }else{
    res.render('admin/login-admin',{admin:false, loginError:req.session.adminLoginError, adminLoggedIn:req.session.adminLoggedIn})
    req.session.adminLoginError = null
  }
});

const adminCredentials = {
  email:"admin@gmail.com",
  password:"admin"
};
router.post('/login', function(req, res) {
  
  console.log(adminCredentials.email);
  if(req.body.Email == adminCredentials.email && req.body.Password == adminCredentials.password){
    console.log('admin logged in');

    const admintoken = jwt.sign(req.body,process.env.ADMIN_TOKEN_SECRET,{expiresIn:'12d'})
      res.cookie('admintoken',admintoken,{
        httpOnly:true
      })
      console.log('login success')
      res.redirect('/admin')
    


  }else{
    console.log("admin not logged in");
    req.session.adminLoginError="Invalid Username or Password"
    res.redirect('/login')
  }
});

router.get('/logout', function(req, res) {


  res.clearCookie('admintoken')
  res.render('admin/login-admin');
})

router.get('/add-user',auth.adminCookieJWTAuth, function(req,res) {
 
  res.render('admin/add-user')
  req.session.fromAdmin = true;

}); 

router.post('/add-user',auth.adminCookieJWTAuth, function(req,res) {
  // console.log(req.body);
  // res.redirect('/admin');
  
  userHelper.addUser(req.body,(result) => {
    res.render('admin/add-user',{admin:true})
  })
});

router.get('/delete-user/',auth.adminCookieJWTAuth, function(req, res) {
  
  let userId=req.query.id
  // console.log(userId);
  userHelpers.deleteUser(userId).then((response) => {
    res.redirect('/admin')
  })
});

// router.get('/edit-user/',async function(req, res) {

//   if(req.session.adminLoggedIn){
//   let userId=req.query.id;
//   let user=await userHelpers.getUserDetails(userId)
//   // console.log(user);
//   res.render('admin/edit-user', {admin:true, user, adminLoggedIn:req.session.adminLoggedIn})
//   req.session.edit=true
//   }else{
//     res.redirect('/admin')
//   }
// });

// router.post('/edit-user', function(req, res){
//   if(req.session.admin){
//     console.log(req.body);
//   let userId=req.params.id
//   userHelpers.updateUser(userId, req.body,req.session).then(() => {
//     res.redirect('/admin/view-users')
//     req.session.edit=null
//   })
// }else{
//   res.redirect('/admin')
// }
// })

router.get('/block-user',auth.adminCookieJWTAuth, (req,res) => {
 
    let userId=req.query.id;
  userHelper.blockUser(userId).then(() => {
    res.redirect('/admin/view-users')
  })
    // console.log("here admin")

  
});

router.get('/unblock-user',auth.adminCookieJWTAuth, (req,res) => {
  let userId=req.query.id
  userHelper.unblockUser(userId).then(() => {
    res.redirect('/admin/view-users')
  })
})

//////admin dashboard//
router.get('/dashboard',auth.adminCookieJWTAuth, function(req,res){
    res.render('admin/dashboard',{admin: true, adminLoggedIn:req.session.adminLoggedIn})
})

//////admin view user//
router.get('/view-users',auth.adminCookieJWTAuth, function(req,res){


  userHelper.getAllUsers().then((users) => {
    // console.log(users);
    res.render('admin/view-users', {admin: true,users, adminLoggedIn:req.session.adminLoggedIn});
    req.session.edit=null
  })
  console.log("here admin")
})

//////////////////product////////////////


router.get('/view-product',auth.adminCookieJWTAuth, function(req,res,next){


    productHelper.getAllProducts().then((product) => {
      console.log(product);
      res.render('admin/view-product', {admin: true,product, adminLoggedIn:req.session.adminLoggedIn});
      req.session.edit=null
    })

  })
  



  router.post('/add-product',auth.adminCookieJWTAuth, function(req,res) {

      
    productHelper.addProduct(req.body,(id) => {
    let image=req.files.Image
    console.log(id)
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
    if(!err){
      res.render("admin/add-product")
      }else{
      console.log(err)
      }
      })
   
    })
    res.redirect('/admin/add-product')

  });
  

  router.get('/add-product',auth.adminCookieJWTAuth, function(req,res) {

      categoryHelper.getAllCategory().then((category)=>{

        res.render('admin/add-product', {admin:true,category, adminLoggedIn:req.session.adminLoggedIn})
      })
      // console.log(category);
    req.session.fromAdmin = true;

  });
  
  

  router.get('/delete-product/',auth.adminCookieJWTAuth, function(req, res) {

    let userId=req.query.id
    // console.log(userId);
    productHelper.deleteProduct(userId).then((response) => {
      res.redirect('/admin/view-product')
    })

  });




  router.get('/edit-product/',auth.adminCookieJWTAuth, async(req,res)=>{
    
      // let category = categoryHelper.getAllCategory(req.query.id)
      // console.log("get il ethi")
      let product=await productHelper.getProductDetails(req.query.id)
      
      categoryHelper.getAllCategory().then((category)=>{
        
        res.render('admin/edit-product',{product,admin:true,adminLoggedIn:req.session.adminLoggedIn,category})
        // res.render('admin/add-product', {admin:true,category, adminLoggedIn:req.session.adminLoggedIn})
      })

  })


  router.post('/edit-product/',auth.adminCookieJWTAuth ,(req,res)=>{
    let id= req.query.id
    productHelper.updateProduct(req.query.id,req.body).then(()=>{
      res.redirect('/admin')      
      console.log(req.body);
      if(req.files?.Image){
        let image=req.files.Image
        image.mv('./public/product-images/'+id+'.jpg')
      }
    })
  })


  ///////////////////////category///////////////

  router.get('/add-category',auth.adminCookieJWTAuth, function(req,res) {

    res.render('admin/add-category', {admin:true, adminLoggedIn:req.session.adminLoggedIn})
    req.session.fromAdmin = true;

  }); 
  
  router.post('/add-category',auth.adminCookieJWTAuth, function(req,res) {
    // console.log(req.body);
    // res.redirect('/admin');
    
    categoryHelper.addCategory(req.body,(result) => {
      res.render('admin/add-category',{admin:true, adminLoggedIn:req.session.adminLoggedIn})
    })
  });

  router.get('/view-category',auth.adminCookieJWTAuth,function(req,res,next){


      categoryHelper.getAllCategory().then((category) => {
        console.log(category);
        res.render('admin/view-category', {admin: true,category, adminLoggedIn:req.session.adminLoggedIn});
        req.session.edit=null
      })
      // console.log("here admin")

    })

    router.get('/delete-category/',auth.adminCookieJWTAuth, function(req, res) {

      let catId=req.query.id
      // console.log(userId);
      categoryHelper.deleteCategory(catId).then((response) => {
        res.redirect('/admin/view-category')
      })

    });

    router.get('/view-orders',auth.adminCookieJWTAuth,(req,res)=>{
      userHelper.getAllUserOrders().then((order) => {
        console.log(order);
        res.render('admin/view-orders',{admin:true,order})
      })
    });


module.exports = router;
