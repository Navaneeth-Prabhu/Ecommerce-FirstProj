var express = require('express');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const productHelper = require('../helpers/product-helpers');
const { response } = require('express');
const jwt = require('jsonwebtoken')
// const cline=require('twilio')
var auth = require('../helpers/userAwth');
const { updateUser } = require('../helpers/user-helpers');
const bannerHelpers = require('../helpers/banner-helpers');
const dotenv=require('dotenv').config()
const paypal = require('../helpers/paypal')

const userJWTTokenAuth = require('../helpers/userAwth');
const { Collection, Db } = require('mongodb');
const collections = require('../config/collections');
const bcrypt=require('bcrypt');
const categoryHelpers = require('../helpers/category-helpers');
// import * as paypal from "../helpers/paypal";


const client = require('twilio')(process.env.ACCOUNT_SID,process.env.AWTH_TOKEN)
var creationFailed;




/* GET home page. */
router.get('/',async function(req, res, next) {

    let user=req.session.user;

  let cartCount =null
  let wishCount = null
  if(req.session.user){

    cartCount=await userHelpers.getCartCount(req.session.user._id)
    wishCount=await userHelpers.getWishCount(req.session.user._id)
  }

  productHelper.trendingPro().then((response)=>{
    trendingPro=response;
    console.log("tre:",trendingPro);
    bannerHelpers.getAllBanner().then((banner)=>{
     banner=banner[0]
      // console.log(banner)
  
      res.render('user/index',{user,banner,cartCount,wishCount,trendingPro})
    })
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
      res.redirect('/')
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
  // console.log("here it is");
  res.render('user/login', {blocked:req.session.userBlocked,loginErr:req.session.loginErr, creationFailed:creationFailed,noPartial:true})
  // res.send('message')
  req.session.loginErr=""
  req.session.userBlocked=""
  creationFailed=""
  }
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
      if(response=="loginError"){
        req.session.loginErr=true;
    } else {
      req.session.loggedIn=true
        req.session.user=response.user
        res.redirect('/')
    }
  }
  })
});



/////////////////////// OTP /////////////login



router.get('/OTP-login', function(req, res) {
  // console.log('got it');
  res.render('user/user_otp')
})

router.post('/OTP-login', function(req, res) {

  try {
    console.log("getting here");
    
        number = req.body.number;
        console.log(number);
        client.verify
        .services(process.env.SERVICE_ID)
        .verifications.create({
          to:`+91${req.body.number}`,
          channel:'sms'
        })
        res.render('user/OTP-login')
   
  } catch (error) {
    console.log(error);
  }
      
  })
  // router.post('/otp',(req,res)=>{
  
  //   console.log('get jfsa;d')
  //   phone_number = req.body.phone_number;
  //   client.verify
  //   .services(process.env.TWILIO_SERVICE_ID)
  //   .verifications.create({
  //     to:`+91${req.body.phone__number}`,
  //     channel:'sms'
  //   })
   
  //   res.render('users/otp',{no__partials:true})
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
    console.log(response);
    if(response.valid==true){
      userHelpers.findTheUser(req.body.number).then((response)=>{
        if(response == 'blocked'){
          console.log('blocked');
        }else if(response){
          console.log("userlogedin");
          req.session.loggedIn=true
          req.session.user=response.user
          res.redirect('/')
        }else{
          console.log("incorrect otp");
        }
      })
    }
  })
  res.redirect('/')
})










router.get('/logout', function(req, res) {
  req.session.user=null
  req.session.loggedIn=null
  req.session.loginErr=null
  res.redirect('/')
  console.log("logout")
});

/* GET home page. */
router.get('/view-products',async function(req, res, next) {

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
  console.log("pro:",product);
  res.render('user/view-products',{user,product,cartCount,wishCount})
})
});



router.get('/productDetails',function(req,res){

  let productId = req.query.id;
  console.log(productId)
    productHelper.getProductDetails(productId).then((product) => {
      console.log(product);
      res.render('user/product-details', {user:req.session.user, product })
    })
});




// router.get('/cart',async function(req,res){

  
//   if(req.session.loggedIn){
//     let products=await userHelpers.getCartProduct(req.session.user._id)
//   //  let address=await userHelpers.getUserAddress(req.)
//   let totalOfferAmount =0
//     let totalAmount =0
//     if(products.length > 0){
      
//       totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
//       totalOfferAmount = await userHelpers.getOfferTotalAmount(req.session.user._id)
      
//     }
//     // console.log(address);
//     res.render('user/cart',{products,user:req.session.user,totalAmount,totalOfferAmount})

//   }
//   else{
//     res.redirect('/login')
//   }
// })

router.get('/cart',async function(req,res){
  try {
    let total = 0
    await userHelpers.getCartProduct(req.session.user._id).then(async(products)=>{
      products.forEach((data) => {

        try {
          if (data.product.offerPrice) {
            data.subTotal = Number(data.quantity) * Number(data.product.offerPrice);
            console.log(Number(data.product.offerPrice));
      
          } else {
            data.subTotal = Number(data.quantity) * Number(data.product.price);
           
          }
         total+=data.subTotal
        } catch (error) {
          data.subTotal = Number(data.quantity) * Number(data.product.price);
        
          total+=data.subTotal
        }
        
       
      });

    

    // let total = await userHelper.getTotalAmount(req.session.user._id);
    
  
    let categories = await categoryHelpers.getAllCategory().catch((err)=>{console.log(err,"hello"); res.redirect('/error')})
    
    
   console.log("tot: ",total);
    res.render("user/cart", { products, total, user: req.session.user,categories});
  }).catch((error)=>{
    console.log(error,"hi");
    res.redirect('/error')});
  } catch (err) {
    console.log(err,"hey");
    res.redirect('/error')
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

// router.post('/change-product-quantity',(req,res,next)=>{
//   console.log(req.body);
//   console.log("body heere");
  
//   userHelpers.changeProductQuantity(req.body).then(async(response)=>{
//     response.total = await userHelpers.getTotalAmount(req.body.user)
//     // response.totalPro = await userHelpers.getTotalProAmo(req.body.user)
//     res.json(response)
//   })
// })


router.post('/change-product-quantity',(req,res,next)=>{
  try {
    let price = 0;
    let offerPrice = 0;
    let total  = 0
    productHelper.getProductDetails(req.body.product).then((response) => {
      price = response.price;
      offerPrice = response?.offerPrice
    }).catch(()=>{res.redirect('/error')});

    // console.log(price);
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      let products = await userHelpers.getCartProduct(req.session.user._id);
      products.forEach((data) => {

  
        try {
          if (data.product.offerPrice) {
            data.subTotal = Number(data.quantity) * Number(data.product.offerPrice);
      
          } else {
            data.subTotal = Number(data.quantity) * Number(data.product.price);
           
          }
         total+=data.subTotal
        } catch (error) {
          data.subTotal = Number(data.quantity) * Number(data.product.price);
        
          total+=data.subTotal
        }
         
       
        
       
      });
      
      response.total = total
      response.price = price;
      response.offerPrice = offerPrice
      res.json(response);
    });
  } catch (err) {
    console.log(err);
    console.log(req.body);
    res.redirect('/error')
  }
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
      res.redirect('/view-products')
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








// router.get('/checkout/',async(req,res)=>{
//   if(req.session.loggedIn){
//     // let product = await userHelpers.getCartProduct(req.body.userId)

//     let userId=req.query.id
//     let total= await userHelpers.getTotalAmount(req.session.user._id)
//     let userDetails= await userHelpers.getUserDetails(userId)
//     let address =await userHelpers.viewAddress(req.session.user._id)
//     res.render('user/checkout',{total,user:req.session.user,userDetails,address})
//     console.log(req.session.user._id);
//   }
//     else{
//     res.redirect('/login')
//   }
// })


router.get('/checkout/',async(req,res)=>{
  try {
    let total = 0
    let products = await userHelpers.getCartProduct(req.session.user._id);
      products.forEach((data) => {

  
        try {
          if (data.product.offerPrice) {
            data.subTotal = Number(data.quantity) * Number(data.product.offerPrice);
      
          } else {
            data.subTotal = Number(data.quantity) * Number(data.product.price);
           
          }
         total+=data.subTotal
        } catch (error) {
          data.subTotal = Number(data.quantity) * Number(data.product.price);
        
          total+=data.subTotal
        }
         
       
        
       
      });
      let userId=req.query.id
      let userDetails= await userHelpers.getUserDetails(userId)
    let address =await userHelpers.viewAddress(req.session.user._id)
    res.render("user/checkout", { total, user: req.session.user,userDetails, address });
  } catch (err) {
    console.log(err);
    res.redirect('/error')
  }

})

router.post('/checkout',async(req,res)=>{
  try {
    // console.log("Checkout form body", req.body);
    
    let products = await userHelpers.getCartProductList(req.session.user._id);

    // products.products.forEach(data=>{
      
    //   userHelper
    //   .removeWish(req.session.user._id, data.item)
    //   .then((response) => {
    //     console.log('');
    //   }).catch(()=>{res.redirect('/error')});;
    // })
    let user = await userHelpers.getUserDetails(req.session.user._id).catch(()=>{res.redirect('/error')});;
   
    let offerPrice = 0
    await userHelpers.getCartProduct(req.session.user._id).then((products)=>{
      products.forEach((data) => {

  
        try {
          if (data.product.offerPrice) {
            data.subTotal = Number(data.quantity) * Number(data.product.offerPrice);
            // offerPrice=
      
          } else {
            data.subTotal = Number(data.quantity) * Number(data.product.price);
           
          }
         total+=data.subTotal
        } catch (error) {
          data.subTotal = Number(data.quantity) * Number(data.product.price);
        
          offerPrice+=data.subTotal
        }
         if (req.body.coupon) {
          let off = Number(req.body.coupon)
          offerPrice= offerPrice-(offerPrice*(off/100))
         }
       
       
      });


    }).catch(()=>{res.redirect('/error')});;
      
    let totalPrice= await userHelpers.getTotalAmount(req.body.userId)
    req.body.UserId = req.session.user._id;
    await userHelpers.placeOrder(req.body, products,offerPrice, totalPrice).then((orderId) => {
   

      if(req.body['payment-method']==='COD'){
        res.json({cod_success:true})
      }
      else if(req.body['payment-method']==='paypal'){
        
        res.json({ cod_success: true });
      }else{
        userHelpers.generateRazorPay(orderId,totalPrice,offerPrice).then((response)=>{
          // console.log('resop:',response);
          res.json(response)
        })
      }
    }).catch(()=>{res.redirect('/error')});;
  } catch (err) {
    console.log(err);
    res.redirect('/error')
  }

})




// router.post('/checkout',async(req,res)=>{
  
//   console.log("in post checkout",req.body['payment-method']);
//   let products = await userHelpers.getCartProductList(req.body.userId)

//   // if(products.length>0){
//     let offerPrice =0;
//     await userHelpers.getCartProduct(req.body.userId).then((products)=>{
//       products.forEach((data)=>{
//         try {
//           if(data.product.offerPrice){
//             console.log("offerpro :",data.product.offerPrice);
//             data.subTotal = Number(data.quantity) * Number(data.product.offerPrice)
//             offerPrice+=data.subTotal
//           }else{
//             offerPrice=0
//           }
          
//         }
//         catch(error){

//         }
//       })
//     })
//     let totalPrice= await userHelpers.getTotalAmount(req.body.userId)
  
//     userHelpers.placeOrder(req.body,products,offerPrice,totalPrice).then((orderId)=>{
//     console.log("in checkout:",orderId);
//     console.log("body:",req.body);
//       if(req.body['payment-method']==='COD'){
//         res.json({cod_success:true})
//       }
//       else if(req.body['payment-method']==='paypal'){
        
//         res.json({ cod_success: true });
//       }else{
//         userHelpers.generateRazorPay(orderId,totalPrice,offerPrice).then((response)=>{
//           console.log('resop:',response);
//           res.json(response)
//         })
//       }
//     })
//   // }else{

//   //   res.redirect('/login')
//   // }
// })




router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log('payment sucessfull');
      res.json({status:true})
    })
  }).catch((err)=>{
    res.json({status:false,errMsg:'payment failed'})
  })
})

router.get('/orderSucessfull',async(req,res)=>{
  if(req.session.loggedIn){
    let userId=req.query.id
    let userDetails= await userHelpers.getUserDetails(userId)
      // console.log('ordered sucessfull')
      res.render('user/orderSucessfull',{user:req.session.user,userDetails})
  }else{
    res.redirect('/login')
  }

})

router.get('/order-history',async(req,res)=>{
 if(req.session.loggedIn){
  let pro=userHelpers.getOrderProducts(req.session.user._id)
      let orders= await userHelpers.getUserOrders(req.session.user._id)
      orders.forEach(element => {
        if(element.status == "Delivered") {
          element.delivered = true;
        } else if (element.status == "Shipped") {
          element.shipped = true;
        } else if(element.status == "cancelled") {
          element.cancelled = true;
        }else if (element.status == "Return") {
          element.Return = true
        }
      });
      res.render('user/order-history',{user:req.session.user,orders,pro})
      // console.log('in order histroy:',pro);
}
  else{
    res.redirect('/login')
  }
})

router.get('/cancel-order/:data',async(req,res)=>{
  if(req.session.loggedIn){
    await userHelpers.cancelOrder(req.body,req.params.data).then((response)=>{
      res.redirect('/order-history')
    })
  }else{
    res.redirect('/login')
  }
})
router.get('/return-order/:data',async(req,res)=>{
  if(req.session.loggedIn){
    await userHelpers.returnOrder(req.body,req.params.data).then((response)=>{
      res.redirect('/order-history')
    })
  }else{
    res.redirect('/login')
  }
})

router.get('/view-order-products/:id',async(req,res)=>{
  if(req.session.loggedIn){
    // console.log("param",req.params.id);
    let products= await userHelpers.getOrderProducts(req.params.id)
    let order= await userHelpers.getUserOrders(req.session.user._id)
    console.log(order);

    res.render('user/order-pro',{user:req.session.user,products,order})
  
    // console.log('in view order products');
  }else{
    res.redirect('/login')
  }
})



///////////////////////PROFILE ?/////////////


router.get('/user-profile',async(req,res)=>{
  if(req.session.loggedIn){

    res.render('user/user-profile',{user:req.session.user,profile:true,passErr:req.session.changePasswordError, success: req.session.success})
    req.session.changePasswordError=null;
    req.session.success = null
  }else{
    res.redirect('/login')
  }
  
})

router.post('/user-profile',async(req,res)=>{
  await userHelpers.updateUser(req.session.user,req.body).then(()=>{
    req.session.user.Name = req.body.Name
    req.session.user.number=req.body.number
    // console.log(req.session.user);
    res.redirect('/user-profile')
  })
})




router.get('/add-address',async(req, res) => {
  if(req.session.loggedIn){
    res.render('user/add-address',{user:req.session.user,profile:true})
  }else{
    res.redirect('/login')
  }
})

router.post('/add-address',async(req, res) => {
  if(req.session.loggedIn){
    await userHelpers.addAddress(req.session.user._id,req.body).then(()=>{
      res.redirect('/user-profile')
    })
  }else{
    res.redirect('/login')
  }
})

router.post('/edit-address', async function(req,res){
  if(req.session.loggedIn){

    let id= req.query.id
    await userHelpers.updateAddress(id,req.body).then(()=>{
      res.redirect('/view-address')      
      console.log(req.query.id);
      
    })
  }else{
    res.redirect('/login')
  }
  })



router.get('/view-address',async(req,res)=>{
userHelpers.viewAddress(req.query.userId).then((response)=>{
  console.log(response);
  res.render('user/view-address',{address:response,user:req.session.user,profile:true})
})
})





router.get('/edit-address',async function(req, res) {

  // if(req.session.loggedIn){
  let userId=req.query.id;
  let address=await userHelpers.getUserAddress(req.query.id)
  // console.log(user);
  res.render('user/edit-address', {address,user:req.session.user})
 
  // }else{
  //   res.redirect('/login')
  // }
});





router.post('/edit-address', async function(req,res){
let id= req.query.id
await userHelpers.updateAddress(req.query.id,req.body).then(()=>{
  res.redirect('/view-address')      
  console.log(req.query.id);
  
  })
})

router.get('/delete-address',function(req,res){
  let userId = req.query.id
  userHelpers.deleteAddress(userId).then((response)=>{
    res.redirect('/view-address')
  })

})



/////////////////CAHANGE PASSWORD////////////////


router.post('/changePass',async function(req,res){
  if(req.session.loggedIn){

   
    
      let userId = req.session.user._id;
    
      let enteredPassword = req.body.password;
      let newPassword = req.body.newPassword;
      let confirmPassword = req.body.confirmPassword
          
      console.log("new:",newPassword);
      console.log("conform",confirmPassword);
      console.log(enteredPassword);
      
      
        if(newPassword==confirmPassword){
          
        let userdetails=await userHelpers.getUserDetails(userId)

          console.log(userdetails);

        bcrypt.compare(enteredPassword,userdetails.Password).then((status)=>{
          if(status){
            userHelpers.changePassword(userId,newPassword).then((response)=>{
              req.session.success = true
              res.redirect('/user-profile')
            })

          }
        })
        
        }else{
          req.session.changePasswordError="entered wrong password";
          res.redirect('/user-profile')
        }
       
     
      }
    })
    

//////paypal/////

router.post("/api/orders", async (req, res) => {
  const order = await paypal.createOrder();
  const total = await userHelpers.getTotalAmount();
  
  res.json(order);
});

router.post("/api/orders/:orderId/capture", async (req, res) => {
  const { orderId } = req.params;
  const captureData = await paypal.capturePayment(orderId);
  res.json(captureData);
});



///////////////Verify coupon///////
router.post('/verifyCoupon',async function(req,res){
  // try {
    let total = 0
    let products = await userHelpers.getCartProduct(req.session.user._id).catch(()=>{res.redirect('/error')});;
      products.forEach((data) => {

  
        try {
          if (data.product.offerPrice) {
            data.subTotal = Number(data.quantity) * Number(data.product.offerPrice);
      
          } else {
            data.subTotal = Number(data.quantity) * Number(data.product.price);
           
          }
         total+=data.subTotal
        } catch (error) {
          
          data.subTotal = Number(data.quantity) * Number(data.product.price);
        
          total+=data.subTotal
        }
         
       
        
       
      });
    
    // let user = await userHelpers.getUserDetails(req.session.user._id);
    // let address = false;
    // if (user.address) {
    //   address = user.address;
    // }
    let address =await userHelpers.viewAddress(req.session.user._id)

    userHelpers.verifyCoupon(req.body).then((coupon)=>{
      console.log(req.body);
      console.log('cou: ',coupon);
      if(coupon){
        total = total - (total* (Number(coupon.off)/100));
      }
      res.render("user/checkout", { total, user: req.session.user, address,coupon });
    });
   
  // } catch (err) {
  //   console.log(err);
  //   res.redirect('/error')
  // }
})


    
/////////////////Download Invoice/////////////////

router.get('/invoice',async function(req,res){
  
})







module.exports = router;
