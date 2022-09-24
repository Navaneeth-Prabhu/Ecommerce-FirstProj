var express = require('express');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const jwt = require('jsonwebtoken')
var auth = require('../helpers/jwt')
require('dotenv').config()
var userHelper = require('../helpers/user-helpers')
var productHelper = require('../helpers/product-helpers')
var categoryHelper = require('../helpers/category-helpers')
var bannerHelpers = require('../helpers/banner-helpers')
var addUserError=require('../routes/user');
const { query, response } = require('express');
const { ORDER_COLLECTION } = require('../config/collections');
const categoryHelpers = require('../helpers/category-helpers');
const couponHelper = require('../helpers/coupon-helpers')

console.log("here 2")

/* GET users listing. */
router.get('/dashboard',auth.adminCookieJWTAuth, async function (req, res, next) {
  console.log("in dashboard");
  try {
    let total = 0
    let newDate = []
    no= 0
    let u_no =0
    await userHelper.getAllUserOrders().then((orders)=>{
      
      // console.log("in try: ",orders);
       orders.forEach(data => {
     
   
        if (data.status == "Delivered") {
          no++
          total=total+data.totalAmount
          console.log(total);
        }
       });
      
     }).catch((err)=>{res.redirect('/error')})
   await  userHelper.getAllUsers().then((users)=>{
    users.reverse()
    let newUsers = []
    let newTrans = []
    for (let index = 0; index < 5; index++) {
      newUsers.push(users[index])
      
    }
    users = newUsers
      userHelper.getAllUserOrders().then(async(orders) => {
        for (let index = 0; index < 3; index++) {
          newTrans.push(orders[index])
          
        }
        orders = newTrans
        try {
          console.log("order: ",orders);
          orders.forEach(data => {
            
            data.date=((data.delivery_details.date))
           console.log("hey");
       
            });
        } catch (err) {
          console.log("err: 2nd try ",err)
          res.redirect('/error')
        }
        await userHelper.getAllUsers().then((users)=>{users.forEach(data => {
     
          u_no++
         
     
          });})
          
      res.render('admin/dashboard',{admin:true,total,users,orders,no,u_no});
    });
 
      
    }).catch(()=>{res.redirect('/error')})
   
 
    
  } catch (err) {
    console.log(err);
    res.redirect('/error')
  }
})




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
  // userHelpers.updateUser(userId, req.body,req.session).then(() => {
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
    let image1=req.files?.image1
    let image2=req.files?.image2
    let image3=req.files?.image3
    let image4=req.files?.image4
    // console.log(id)
    image1.mv(`./public/product-images/${id}1.jpg`,(err,done)=>{
      })
    image2.mv(`./public/product-images/${id}2.jpg`,(err,done)=>{
      })
    image3.mv(`./public/product-images/${id}3.jpg`,(err,done)=>{
      })
    image4.mv(`./public/product-images/${id}4.jpg`,(err,done)=>{
      })

   
    })
    res.redirect('/admin/add-product')

  });
  
// router.post('/add-product',auth.adminCookieJWTAuth,function (req,res){

//   try{
 
//       productHelper.addProduct(req.body, async(id) => {
//       try {
//         let image = req.files.image1;

//         let subImages = []
//         if(req.files?.image2){subImages.push(req.files?.image2)}
//         if(req.files?.image3){subImages.push(req.files?.image3)}
//         if(req.files?.image4){subImages.push(req.files?.image4)}
//         try {
          
       
//         for (let index = 0; index < subImages.length; index++) {
//          await subImages[index].mv("./public/product-images/" + id + index +".jpg", (err, data) => {
//             if (!err) {
            
//             console.log("sub images added",index);
            
//             } else {
//               console.log(err);
//             }
//           })
          
//         }
//       } catch (error) {
        
//           res.redirect('/error')
//       }
//         if (image) {
//           await image.mv("./public/product-images/" + id + ".jpg", (err, data) => {
//             if (!err) {
//               // res.redirect("/admin/products");
//              console.log("image added");
//             } else {
//               console.log(err);
//             }
//           });
//         }

        
//       } catch (error) {
//         console.log(error);
//         res.redirect('/admin/products')
//       }
//         finally{
//           res.redirect("/admin/products")
//         }
//         }).then(()=>{console.log("added succesfully")}).catch((err)=>{console.log(err);});
//   }catch(err){
//     console.log(err+"error in add product")
//     res.redirect('/error')
//   }
// })
  

  

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
      res.redirect('/admin/view-product')      
      console.log(req.body);
      if(req.files?.image1){
        let image1=req.files.image1
        image1.mv(`./public/product-images/${id}1.jpg`)
      }
      if(req.files?.image2){
        let image2=req.files.image2
        image2.mv(`./public/product-images/${id}2.jpg`)
      }
      if(req.files?.image3){
        let image3=req.files.image3
        image3.mv(`./public/product-images/${id}3.jpg`)
      }
      if(req.files?.image4){
        let image4=req.files.image4
        image4.mv(`./public/product-images/${id}4.jpg`)
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

    router.get('/edit-category/',auth.adminCookieJWTAuth, async(req,res)=>{
    
      let category=await categoryHelper.getCategory(req.query.id)
             
        res.render('admin/edit-category',{admin:true,adminLoggedIn:req.session.adminLoggedIn,category})
       
      })



  router.post('/edit-category/',auth.adminCookieJWTAuth ,(req,res)=>{
    // let id= req.query.id
    categoryHelper.updateCategory(req.query.id,req.body).then(()=>{
      res.redirect('/view-category')      
      console.log(req.body);
     
    })
  })


    router.get('/delete-category/',auth.adminCookieJWTAuth, function(req, res) {

      let catId=req.query.id
      // console.log(userId);
      categoryHelper.deleteCategory(catId).then((response) => {
        res.redirect('/admin/view-category')
      })

    });



/////////////////////ORDER///////////////////////


    router.get('/view-orders',auth.adminCookieJWTAuth,(req,res)=>{
      userHelper.getAllUserOrders().then((order) => {
        order.forEach(element => {
          if(element.status == "Delivered") {
            element.delivered = true;
          } else if (element.status == "Shipped") {
            element.shipped = true;
          } else if(element.status == "cancelled") {
            element.delivered = true;
          }
        });
        // console.log(order);
        res.render('admin/view-orders',{admin:true,order})
      })
    });




  router.post('/edit-status/:data',auth.adminCookieJWTAuth,async(req,res,next)=>{
    
    console.log('in edit-status');
    console.log(req.params.data);
    await userHelper.updateStatus(req.body.status,req.params.data).then((response)=>{
      res.redirect('/admin/view-orders')

    })
  })

  router.get('/order-products/:id',async(req,res)=>{
    // if(req.session.loggedIn){
      
      let products= await userHelpers.getOrderProducts(req.params.id)
      console.log(products);
      // res.send("hiiii")
      res.render('admin/order-pro',{products})
    
      console.log('in view order products');
    // }else{
    //   res.redirect('/login')
    // }
  })

  ////////////////////BANNER//////////////

  router.post('/add-banner',auth.adminCookieJWTAuth, function(req,res) {

      
    bannerHelpers.addBanner(req.body,(id) => {
    let image=req.files.Image
    console.log(id)
    image.mv('./public/banner-images/'+id+'.jpg',(err,done)=>{
    if(!err){
      res.render("admin/add-banner")
      }else{
      console.log(err)
      }
      })
   
    })
    res.redirect('/admin/add-banner')

  });
  

  router.get('/add-banner',auth.adminCookieJWTAuth, function(req,res) {

      bannerHelpers.getAllBanner().then((banner)=>{

        res.render('admin/add-banner', {admin:true,banner, adminLoggedIn:req.session.adminLoggedIn})
      })
    req.session.fromAdmin = true;

  });


  router.get('/view-banner',auth.adminCookieJWTAuth,function(req,res,next){


      bannerHelpers.getAllBanner().then((banner) => {
        console.log(banner);
        res.render('admin/view-banner', {admin: true,banner, adminLoggedIn:req.session.adminLoggedIn});
        req.session.edit=null
      })
      // console.log("here admin")

    })

    router.get('/edit-banner/',auth.adminCookieJWTAuth, async(req,res)=>{
    
      let banner=await bannerHelpers.getBanner(req.query.id)
             
        res.render('admin/edit-banner',{admin:true,adminLoggedIn:req.session.adminLoggedIn,banner})
       
      })



      router.post('/edit-banner/',auth.adminCookieJWTAuth ,(req,res)=>{
        let id= req.query.id
        bannerHelpers.updateBanner(req.query.id,req.body).then(()=>{
          res.redirect('/admin/view-banner')      
          console.log(req.body);
          if(req.files?.Image){
            let image=req.files.Image
            image.mv('./public/banner-images/'+id+'.jpg')
          }
        })
      })


    router.get('/delete-banner/',auth.adminCookieJWTAuth, function(req, res) {

      let bannerId=req.query.id
      // console.log(userId);
      bannerHelpers.deleteBanner(bannerId).then((response) => {
        res.redirect('/admin/view-banner')
      })

    });



    router.get('/men-watches',function(req,res){
      productHelper.getMenWatch()
    })


//////admin dashboard///////////




// router.get('/dashboard',auth.adminCookieJWTAuth, async function(req,res){
  


//   exports.dashboard= async (req, res) => {
//     try {
//       let total = 0
//       let newDate = []
//       no= 0
//       let u_no =0
//       await userHelper.getAllUserOrders().then((orders)=>{
        
 
//          orders.forEach(data => {
       
     
//           if (data.status == "Delivered") {
//             no++
//             total=total+data.totalAmount
//           }
//          });
        
//        }).catch((err)=>{res.redirect('/error')})
//      await  userHelper.getAllUsers().then((users)=>{
//       users.reverse()
//       let newUsers = []
//       let newTrans = []
//       for (let index = 0; index < 5; index++) {
//         newUsers.push(users[index])
        
//       }
//       users = newUsers
//         userHelper.getAllUserOrders().then(async(orders) => {
//           for (let index = 0; index < 3; index++) {
//             newTrans.push(orders[index])
            
//           }
//           orders = newTrans
//           try {
//             console.log(orders,"oooooordders");
//             orders.forEach(data => {
              
//               data.date=((data.deliveryDetails.Date).toLocaleDateString("en-US"))
             
         
//               });
//           } catch (err) {
//             console.log("errrrrrrrrrrrrrrrrrrrrr",err)
//             res.redirect('/error')
//           }
//           await userHelper.getAllUsers().then((users)=>{users.forEach(data => {
       
//             u_no++
           
       
//             });})
            
//         res.render('admin/dashboard',{admin:true,total,users,orders,no,u_no});
//       });
   
        
//       }).catch(()=>{res.redirect('/error')})
     
   

     
      
//     } catch (err) {
//       console.log(err);
//       res.redirect('/error')
//     }
//   };

// })
   

    router.get("/stats", auth.adminCookieJWTAuth, async (req, res) => {
      const today = new Date();
      const latYear = today.setFullYear(today.setFullYear() - 1);
    
      try {
        const data = await  db.get().collection(ORDER_COLLECTION).aggregate([
          {
            $match:{
                status:"Delivered"
            },
          },
          {
            $project: {
              month: { $month: "$delivery_details.date" },
              total:"$totalAmount"
            },
          },
          {
            $group: {
              _id: "$month",
              total: { $sum: "$total" },
            },
          },
        ]).sort({ _id: -1 }).toArray();
        res.status(200).json(data)
        console.log(data);
      } catch (err) {
        res.status(500).json(err).redirect('/error');
        console.log(err);
      }
    });
    
    router.get("/stats2", auth.adminCookieJWTAuth, async (req, res) => {
      const today = new Date();
      const latYear = today.setFullYear(today.setFullYear() - 1);
    
      try {
        const data = await  db.get().collection(ORDER_COLLECTION).aggregate([
          {
            $match:{
                status:"Delivered"
            },
          },
          {
          
            $project: {
              week: { $week: "$delivery_details.date" },
              total:"$totalAmount"
            },
          },
          {
            $group: {
              _id: "$week",
              total: { $sum: "$total" },
            },
          },
        ]).sort({ _id: -1 }).toArray();
        res.status(200).json(data)
        console.log(data);
      } catch (err) {
        res.status(500).json(err).redirect('/error');
        console.log(err);
      }
    });
    router.get("/stats3", auth.adminCookieJWTAuth, async (req, res) => {
      const today = new Date();
      const latYear = today.setFullYear(today.setFullYear() - 1);
    
      try {
        const data = await  db.get().collection(ORDER_COLLECTION).aggregate([
          {
            $match:{
                status:"Delivered"
            },
          },
          {
          
            $project: {
              dayOfMonth: { $dayOfMonth: "$delivery_details.date" },
              total:"$totalAmount"
            },
          },
          {
            $group: {
              _id: "$dayOfMonth",
              total: { $sum: "$total" },
            },
          },
        ]).sort({ _id: -1 }).toArray();
        res.status(200).json(data)
        console.log(data);
      } catch (err) {
        res.status(500).json(err).redirect('/error');
        console.log(err);
      }
    });
    
    router.get("/stats4", auth.adminCookieJWTAuth, async (req, res) => {
      const today = new Date();
      const latYear = today.setFullYear(today.setFullYear() - 1);
    
      try {
        const data = await  db.get().collection(ORDER_COLLECTION).aggregate([
          {
            $match:{
                status:"Delivered"
            },
          },
          {
            $project: {
              year: { $year: "$delivery_details.date" },
              total:"$totalAmount"
            },
          },
          {
            $group: {
              _id: "$year",
              total: { $sum: "$total" },
            },
          },
        ]).sort({ _id: -1 }).toArray();
        res.status(200).json(data)
        console.log(data);
      } catch (err) {
        res.status(500).json(err).redirect('/error');
        console.log(err);
      }
    });
    
    router.get('/getMostStats', auth.adminCookieJWTAuth,async (req,res)=>{
     
    
      await productHelper.getMostStats().then(async(response)=>{
      let top = 0
      for (let i= 0; i < response.length-1; i++) {
        if (response[i].count<response[i+1].count) {
          top  = response[i+1]
        }
      }
    productHelper.getProductDetails(top._id).then(async(product)=>{
       try {
         product.count = top.count
        
      } catch (error) {
        console.log("wait for top");
      }
     
      res.json(product)
    })
    })
    })






        ///////////////OFFER?//////////////



    router.get('/view-offer',auth.adminCookieJWTAuth,function(req,res){
          categoryHelper.getAllCategory().then((categories) => {
            console.log(categories);
            res.render('admin/view-offer',{admin:true, categories})
          })
           
        })

    router.post('/add-offer',auth.adminCookieJWTAuth, function(req,res) {
      
    try {
            console.log("in try");
            console.log(req.body);
            let catId = req.body.SubCategory
            let off = req.body.offer
            let validTill = req.body.date_end
            let validFrom = req.body.date_start
            categoryHelper.addCategoryOff(catId,off,validTill, validFrom).then(()=>{
              res.redirect("/admin/view-offer")
            })
         }
         catch(err){
          res.redirect('/error')
          console.log(err);
         }

        });
        

        
        router.get('/add-offer',auth.adminCookieJWTAuth,function(req,res){
        categoryHelper.getAllCategory().then((category)=>{
            res.render('admin/add-offer',{admin:true,category})
          })
        })

        router.get('/delete-offer', function(req, res) {
          categoryHelpers.deleteCategoryOffer(req.query.id).then((response) => {
            console.log(response);
            res.redirect('/admin/view-offer')
          })
        })



    ///////coupon//////////////////


    router.post('/coupons',auth.adminCookieJWTAuth,function(req,res){
      try {
        couponHelper.addCoupon(req.body).catch(()=>{res.redirect('/error')})
          res.redirect("/admin/coupons");
  
        // redirect to /admin/manage-categories
      } catch (err) {
        console.log("post:",err);
        res.redirect('/error')
      }
    })

    router.get('/coupons',auth.adminCookieJWTAuth,function(req,res){

      
      try {
        console.log("in try");
        couponHelper.getCoupons().then((response)=>{
          console.log("in helper");
          let coupons=  response
  
          res.render("admin/coupons",{coupons,admin:true});
      }).catch(()=>{res.redirect('/error')})
     } catch (err) {
        console.log("get:",err);
        res.redirect('/error')
      }
    })

    router.get('/delete-coupon',auth.adminCookieJWTAuth,function(req,res){
      try {
        let proid=req.query.id
      couponHelper.deleteCoupon(proid).catch(()=>{res.redirect('/error')})
        res.redirect("/admin/coupons")
      } catch (err) {
        console.log(err);
        res.redirect('/error')
      }
    })
  


module.exports = router;
