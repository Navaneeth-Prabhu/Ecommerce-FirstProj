var express = require('express');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const productHelper = require('../helpers/product-helpers')
console.log("here")
var creationFailed;

/* GET home page. */
router.get('/',async function(req, res, next) {

    let user=req.session.user;
  // console.log(user);
  // console.log("here user")
  // res.render('index', {user});
  let cartCount =null
  if(req.session.user){

    cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  productHelper.getAllProducts().then((product)=>{
    console.log(product);
    res.render('user/view-products',{user,product,cartCount})
  })
});

router.get('/login', function(req,res) {
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
  res.render('user/login', {blocked:req.session.userBlocked,loginErr:req.session.loginErr, creationFailed:creationFailed})
  req.session.loginErr=""
  req.session.userBlocked=""
  creationFailed=""
  }
});

router.get('/signup', function(req,res) {
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/signup')
  }
});

router.post('/signup', function(req,res) {
  console.log(req.session.fromAdmin);
  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);
    console.log(req.body);
    if(response == false){
      creationFailed="Signup failed! Email Id exists";
    }
    if(req.session.fromAdmin){
      res.redirect('/admin')
      req.session.fromAdmin = false
    }else{
    res.redirect('/login')
    }
  }) 
});

router.post('/login', function(req, res) {
  userHelpers.doLogin(req.body).then((response) => {
    if(response == "blocked"){
      req.session.userBlocked = true;
      res.redirect('/login')
    }else if(! response){
      req.session.loginErr="Invalid Username or Password"
      res.redirect('/login')
    }else{
      if(response.status){
        req.session.loggedIn=true
        req.session.user=response.user
        res.redirect('/')
    }
  }
  })
});

router.get('/logout', function(req, res) {
  req.session.user=null
  req.session.loggedIn=null
  req.session.loginErr=null
  res.redirect('/')
  console.log("logout")
});

router.get('/product-details', function(req, res) {

  if(req.session.loggedIn){
    productHelper.getProductDetails()
  }
})


router.get('/productDetails',function(req,res){

  let productId = req.query.id;
    productHelper.getProductDetails(productId).then((product) => {
      console.log(product);
      res.render('user/product-details', {user:req.session.user,product})
    })
});




router.get('/cart',function(req,res){
  if(req.session.loggedIn){
    let product=userHelpers.getCartProduct(req.session.user._id)
    console.log(product +'heloo');
    res.render('user/cart',{product,user:req.session.user})
  }
  else{
    res.redirect('/login')
  }
})

router.get('/add-to-cart/:id',async(req,res)=>{
  if(req.session.loggedIn){
    console.log("api calling");
    userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
      res.json({status:true})
    })
  }
  // else{
  //   res.redirect('/login')
  // }
})





module.exports = router;
