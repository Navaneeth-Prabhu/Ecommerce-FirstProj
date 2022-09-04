var express = require('express');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
var userHelper = require('../helpers/user-helpers')
var productHelper = require('../helpers/product-helpers')
var categoryHelper = require('../helpers/category-helpers')
var addUserError=require('../routes/user');
const { query } = require('express');
console.log("here 2")

/* GET users listing. */
router.get('/', function(req, res, next) {
  // console.log(req.session.adminLoggedIn);
  if (req.session.adminLoggedIn) {
    userHelpers.getAllUsers().then((users) => {
      console.log(users);
      res.render('admin/dashboard', {admin: true,users, adminLoggedIn:req.session.adminLoggedIn});
      req.session.edit=null
    })
    console.log("here admin")
  }else{
    res.redirect('/admin/login');
  }
});

router.get('/login', function(req,res) {
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
    req.session.adminLoggedIn = true;
    req.session.admin = req.body.Email;
    res.redirect('/admin');
    console.log(req.session);
  }else{
    console.log("admin not logged in");
    req.session.adminLoginError="Invalid Username or Password"
    res.redirect('/admin')
  }
});

router.get('/logout', function(req, res) {
  // console.log('logout');
  // console.log('logout',req.session.adminLoggedIn);
  req.session.admin =null
  req.session.adminLoggedIn = null
  req.session.adminLoginError = null
  res.redirect('/admin');
})

router.get('/add-user', function(req,res) {
  if(req.session.adminLoggedIn){
  res.render('admin/add-user', {admin:true, adminLoggedIn:req.session.adminLoggedIn})
  req.session.fromAdmin = true;
  }else{
    res.redirect('/admin')
  }
}); 

router.post('/add-user', function(req,res) {
  // console.log(req.body);
  // res.redirect('/admin');
  
  userHelper.addUser(req.body,(result) => {
    res.render('admin/add-user',{admin:true, adminLoggedIn:req.session.adminLoggedIn})
  })
});

router.get('/delete-user/', function(req, res) {
  if(req.session.adminLoggedIn){
  let userId=req.query.id
  // console.log(userId);
  userHelpers.deleteUser(userId).then((response) => {
    res.redirect('/admin')
  })
  }else{
    res.redirect('/admin')
  }
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

router.get('/block-user', (req,res) => {
  if (req.session.adminLoggedIn) {
    let userId=req.query.id;
  userHelper.blockUser(userId).then(() => {
    res.redirect('/admin/view-users')
  })
    // console.log("here admin")
  }else{
    res.redirect('/admin');
  }
  
});

router.get('/unblock-user', (req,res) => {
  let userId=req.query.id
  userHelper.unblockUser(userId).then(() => {
    res.redirect('/admin/view-users')
  })
})

//////admin dashboard//
router.get('/dashboard',function(req,res){
  if(req.session.adminLoggedIn){
    res.render('admin/dashboard',{admin: true, adminLoggedIn:req.session.adminLoggedIn})
  }
  else{
    res.redirect('/admin')
  }
})
//////admin view user//
router.get('/view-users',function(req,res){

if (req.session.adminLoggedIn) {
  userHelper.getAllUsers().then((users) => {
    // console.log(users);
    res.render('admin/view-users', {admin: true,users, adminLoggedIn:req.session.adminLoggedIn});
    req.session.edit=null
  })
  console.log("here admin")
}else{
  res.redirect('/admin');
}
})

//////////////////product////////////////


router.get('/view-product',function(req,res,next){

  if (req.session.adminLoggedIn) {
    productHelper.getAllProducts().then((product) => {
      console.log(product);
      res.render('admin/view-product', {admin: true,product, adminLoggedIn:req.session.adminLoggedIn});
      req.session.edit=null
    })
    // console.log("here admin")
  }else{
    res.redirect('/admin');
  }
  })
  



  router.post('/add-product', function(req,res) {
    if(req.session.adminLoggedIn){
      // console.log(req.body);
      // console.log(req.files.Image);
      
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
    }
    else{
      res.redirect('/admin')
    }
  });
  

  router.get('/add-product', function(req,res) {
    if(req.session.adminLoggedIn){

      let category= categoryHelper.getAllCategory()
    res.render('admin/add-product', {admin:true,category, adminLoggedIn:req.session.adminLoggedIn})
    req.session.fromAdmin = true;
    }else{
      res.redirect('/admin')
    }
  });
  
  

  router.get('/delete-product/', function(req, res) {
    if(req.session.adminLoggedIn){
    let userId=req.query.id
    // console.log(userId);
    productHelper.deleteProduct(userId).then((response) => {
      res.redirect('/admin/view-product')
    })
    }else{
      res.redirect('/admin')
    }
  });




  router.get('/edit-product',async(req,res)=>{
    if(req.session.adminLoggedIn){
      console.log("get il ethi")
      let product=await productHelper.getProductDetails(req.query.id)
      res.render('admin/edit-product',{product,admin:true,adminLoggedIn:req.session.adminLoggedIn})
    }
    else{
      res.redirect("/admin/view-product")
    }
  })


  router.post('/edit-product/',(req,res)=>{
    let id= req.params.id
    productHelper.updateProduct(req.query.id,req.body).then(()=>{
      res.redirect('/admin')      
      if(req.files.Image){
        let image=req.files.Image
        image.mv('./public/product-images/'+id+'.jpg')
      }
    })
  })


  ///////////////////////category///////////////

  router.get('/add-category', function(req,res) {
    if(req.session.adminLoggedIn){
    res.render('admin/add-category', {admin:true, adminLoggedIn:req.session.adminLoggedIn})
    req.session.fromAdmin = true;
    }else{
      res.redirect('/admin')
    }
  }); 
  
  router.post('/add-category', function(req,res) {
    // console.log(req.body);
    // res.redirect('/admin');
    
    categoryHelper.addCategory(req.body,(result) => {
      res.render('admin/add-category',{admin:true, adminLoggedIn:req.session.adminLoggedIn})
    })
  });

  router.get('/view-category',function(req,res,next){

    if (req.session.adminLoggedIn) {
      categoryHelper.getAllCategory().then((category) => {
        console.log(category);
        res.render('admin/view-category', {admin: true,category, adminLoggedIn:req.session.adminLoggedIn});
        req.session.edit=null
      })
      // console.log("here admin")
    }else{
      res.redirect('/admin');
    }
    })

    router.get('/delete-category/', function(req, res) {
      if(req.session.adminLoggedIn){
      let catId=req.query.id
      // console.log(userId);
      categoryHelper.deleteCategory(catId).then((response) => {
        res.redirect('/admin/view-category')
      })
      }else{
        res.redirect('/admin')
      }
    });



module.exports = router;
