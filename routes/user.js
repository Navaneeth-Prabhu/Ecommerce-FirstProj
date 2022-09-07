var express = require('express');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const productHelper = require('../helpers/product-helpers');
const { response } = require('express');

const jwt = require('jsonwebtoken')
var auth = require('../helpers/userAwth')
const dotenv=require('dotenv').config()

const client = require('twilio')(process.env.ACCOUNT_SID,process.env.AWTH_TOKEN)
var creationFailed;




/* GET home page. */
router.get('/',async function(req, res, next) {

    let user=req.session.user;
  // console.log(user);
  // console.log("here user")
  // res.render('index', {user});
  let cartCount =null
  let wishCount = null
  if(req.session.user){

    cartCount=await userHelpers.getCartCount(req.session.user._id)
    wishCount=await userHelpers.getWishCount(req.session.user._id)
  }
  productHelper.getAllProducts().then((product)=>{
    // console.log(product);
    res.render('user/view-products',{user,product,cartCount,wishCount})
  })
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
    // console.log(response);
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


/////////////////////// OTP /////////////login



router.get('/OTP-login', function(req, res) {
  // console.log('got it');
  res.render('user/user_otp')
})

router.post('/OTP-login', function(req, res) {

      console.log("getting here");
        // number = req.body.number;
        client.verify
        .services(process.env.SERVICE_ID)
        .verifications.create({
          to:`+91${req.body.number}`,
          channel:'sms'
        })
        res.render('user/OTP-login')
  })



// router.post('/enter-otp',(req,res)=>{
//   const otp=req.body.otp
//   console.log('otp',otp);
//   client.verify
//   .services(process.env.SERVICE_ID)
//   .verificationChecks.create({
//     to:`+91${req.body.number}`,
//     code:otp
//   }).then((response)=>{
//     console.log(response);
//   })
//   res.redirect('/')
// })

router.post('/enter-otp',(req,res)=>{
  const otp=req.body.otp
  console.log('otp',otp);
  client.verify
  .services(process.env.SERVICE_ID)
  .verificationChecks.create({
    to:`+91${req.body.number}`,
    code:otp
  }).then((response)=>{
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
    // console.log(response);
})
})









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




router.get('/cart',async function(req,res){
  if(req.session.loggedIn){
    let products=await userHelpers.getCartProduct(req.session.user._id)
   
    let totalAmount =0
    if(products.length > 0){
      
      totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
      
    }
    // console.log(products);
    res.render('user/cart',{products,user:req.session.user,totalAmount})
  }
  else{
    res.redirect('/login')
  }
})

router.get('/add-to-cart/:id',(req,res)=>{
  if(req.session.loggedIn){
    console.log("api calling");
    userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
      res.json({status:true})
    })
  }
  else{
    res.redirect('/login')
  }
})

router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body);
  console.log("body heere");
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total = await userHelpers.getTotalAmount(req.body.user)
    // response.totalPro = await userHelpers.getTotalProAmo(req.body.user)
    res.json(response)
  })
})

router.post('/delete-cart-product',(req,res,next)=>{
  if(req.session.loggedIn){

    console.log(req.body);
    console.log('delete-pro');
    userHelpers.deleteCartProduct(req.body).then((response)=>{
      res.json(response)
      // res.redirect('user/cart')
    })
  }else{
    res.redirect('/login')
  }
})

////////Wsihlist//////////
router.get('/wishlist',async(req,res)=>{
  if(req.session.loggedIn){

    let products = await userHelpers.getWishPro(req.session.user._id)
    res.render('user/wishlist',{products,user:req.session.user})
  }else{
    res.redirect('/login')
  }
})



router.get('/add-to-wishlist/:id',(req,res)=>{
  if(req.session.loggedIn){

    userHelpers.addToWishlist(req.params.id,req.session.user._id).then(()=>{
      res.redirect('/')
      console.log('in add to wishlist');
    })
  }else{
    res.redirect('/login')
  }
})

router.post('/delete-wish-product',(req,res,next)=>{
  if(req.session.loggedIn){

    console.log(req.body);
    console.log('delete-pro');
    userHelpers.deleteWishProduct(req.body).then((response)=>{
      res.json(response)
      // res.redirect('user/cart')
    })
  }else{
    res.redirect('/login')
  }
})

// router.get('/delete-cart-product/', function(req, res) {
// if(req.session.loggedIn){

//   let proId=req.query.id
//   let userId=req.session.user._id
//   // console.log(userId);
//   categoryHelper.deleteCartProduct(proId,userId).then((response) => {
//     res.redirect('user/cart')
//   })
// }else{
//   redirect('/login')
// }

// });



// exports.deleteProduct = (req, res) => {
//   try {
//     userHelper.deleteProduct(req.body).then(() => {
//       res.json({ status: true });
//     });
//   } catch (err) {
//     console.log(err);
//   }
// };
// router.get('/delete-cart-product/',function(req, res) {

//   let userId=req.query.id
//   // console.log(userId);
//   productHelper.deleteProduct(userId).then((response) => {
//     res.redirect('/admin/view-product')
//   })

// });




router.get('/checkout',async(req,res)=>{
  if(req.session.loggedIn){

    let total= await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/checkout',{total,user:req.session.user})
  }
    else{
    res.redirect('/login')
  }
})

router.post('/checkout',async(req,res)=>{

  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice= await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
    res.json(response)
    res.json({status:true})
    console.log('in checkout');
  })
// 
    console.log(req.body);

})

router.get('/orderSucessfull',(req,res)=>{

    console.log('ordered sucessfull')
    res.render('user/orderSucessfull',{user:req.session.user})

})

router.get('/order-history',async(req,res)=>{
 if(req.session.loggedIn){
      let orders= await userHelpers.getUserOrders(req.session.user._id)
      res.render('user/order-history',{user:req.session.user,orders})
      console.log('in order histroy');
}
  else{
    res.redirect('/login')
  }
})

router.get('/view-order-products/:id',async(req,res)=>{
  // if(req.session.loggedIn){

    let products = await userHelpers.getOrderProducts(req.params.id)
    res.render('user/view-order-products',{user:req.session.user,products})
    console.log(products);
  // }
  // else{
  //   res.redirect('/login')
  // }
})

module.exports = router;
