var express = require("express");
const userHelpers = require("../helpers/user-helpers");
var router = express.Router();
const productHelper = require("../helpers/product-helpers");
const { response } = require("express");
const jwt = require("jsonwebtoken");
// const cline=require('twilio')
var auth = require("../helpers/userAwth");
const { updateUser } = require("../helpers/user-helpers");
const bannerHelpers = require("../helpers/banner-helpers");
const dotenv = require("dotenv").config();
const paypal = require("../helpers/paypal");

const userJWTTokenAuth = require("../helpers/userAwth");
const { Collection, Db, ObjectId } = require("mongodb");
const collections = require("../config/collections");
const bcrypt = require("bcrypt");
const categoryHelpers = require("../helpers/category-helpers");
const couponHelpers = require("../helpers/coupon-helpers");
const walletHelpers = require("../helpers/wallet-helpers");
// import * as paypal from "../helpers/paypal";
var db = require("../config/connection");
var collection = require("../config/collections");

var objectId = require("mongodb").ObjectId;

const client = require("twilio")(
  process.env.ACCOUNT_SID,
  process.env.AWTH_TOKEN
);
var creationFailed;

const verifyLoggin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    res.redirect("/admin/dashboard");
  } else if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;

  let cartCount = null;
  let wishCount = null;
  let wishlist = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
    wishlist = await userHelpers.getWishProd(req.session.user._id);
    wishlist = wishlist?.products;
    console.log("wish", wishlist);
  }

  let newProducts = await db
    .get()
    .collection(collections.PRODUCT_COLLECTION)
    .find()
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();

  productHelper.trendingPro().then((response) => {
    trendingPro = response;
    // console.log("tre:",trendingPro);
    bannerHelpers.getAllBanner().then((banner) => {
      banner = banner[0];
      // console.log(banner)

      res.render("user/index", {
        user,
        banner,
        cartCount,
        wishCount,
        trendingPro,
        newProducts,
        wishlist,
      });
    });
  });
});

router.get("/signup", function (req, res) {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/signup", { noPartial: true });
  }
});

router.post("/signup", function (req, res) {
  // console.log(req.session.fromAdmin);
  userHelpers.doSignup(req.body).then((response) => {
    // console.log(response);
    console.log(req.body);
    if (response == false) {
      console.log('false');
      res.json({creationFailed :"invalid email"});
    } else if (response == "invalid referal") {
      console.log("invalid");
      res.json({ status: "error" });
    } else if (req.session.fromAdmin) {
      res.redirect("/");
      req.session.fromAdmin = false;
    } else {
      res.redirect("/login");
    }
  });
});

router.get("/login", function (req, res) {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    // console.log("here it is");
    res.render("user/login", {
      blocked: req.session.userBlocked,
      loginErr: req.session.loginErr,
      creationFailed: creationFailed,
      noPartial: true,
    });
    // res.send('message')
    req.session.loginErr = "";
    req.session.userBlocked = "";
    creationFailed = "";
  }
});

router.post("/login", function (req, res) {
  userHelpers.doLogin(req.body).then((response) => {
    if (response == "blocked") {
      req.session.userBlocked = true;
      res.redirect("/login");
    } else if (!response) {
      req.session.loginErr = "Invalid Username or Password";
      res.redirect("/login");
    } else {
      if (response == "loginError") {
        req.session.loginErr = true;
      } else {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      }
    }
  });
});

/////////////////////// OTP /////////////login

router.get("/user_otp", function (req, res) {
  // console.log('got it');
  res.render("user/user_otp",{noPartial:true});
});

router.post("/user_otp", function (req, res) {
  try {
    console.log("getting here");

    number = req.body.number;
    console.log(number);
    client.verify
      .services(process.env.SERVICE_ID)
      .verifications.create({
        to: `+91${req.body.number}`,
        channel: "sms",
      })
      .then((data) => {
        console.log(data);
      });
    res.render("user/OTP-login", { number, noPartial: true });
  } catch (error) {
    console.log(error);
  }
});

router.post("/OTP-login", (req, res) => {
  console.log();
  const otp = req.body.otp;
  const number = req.body.number;
  console.log("otp", otp);
  console.log("num", number);
  client.verify
    .services(process.env.SERVICE_ID)
    .verificationChecks.create({
      to: `+91${req.body.number}`,
      code: otp,
    })
    .then((response) => {
      console.log(response);
      if (response.valid == true) {
        userHelpers.findTheUser(req.body.number).then((response) => {
          if (response == "blocked") {
            console.log("blocked");
          } else if (response) {
            console.log("userlogedin");
            req.session.loggedIn = true;
            req.session.user = response;
            res.redirect("/");
          } else {
            console.log("incorrect otp");
          }
        });
      }
    });
});

router.post("/checkotp", (req, res) => {
  const { otp, number } = req.body;
  try {
    client.verify
      .services(serverSID)
      .verificationChecks.create({ to: `+91${number}`, code: otp })
      .then((resp) => {
        if (!resp.valid) {
          res.render("user/checkOtp", {
            otperror: "Enter valid OTP",
            noPartial: true,
          });
        } else {
          res.redirect("/");
        }
      });
  } catch (err) {
    console.log(err + "hoi this is error");
  }
});

router.get("/logout", function (req, res) {
  req.session.user = null;
  req.session.loggedIn = null;
  req.session.loginErr = null;
  res.redirect("/");
  console.log("logout");
});

/* GET home page. */
router.get("/view-products", async function (req, res, next) {
  let page = req.params.page || 1;
  if (req.query.page) {
    page = req.query.page;
  }
  const limit = 9;

  let pages= await db.get().collection(collection
    .PRODUCT_COLLECTION).count()
    pageLimit = Math.ceil(pages/limit)

  let user = req.session.user;
  let cartCount = null;
  let wishCount = null;
  let wishlist = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
    wishlist = await userHelpers.getWishProd(req.session.user._id);
    wishlist = wishlist?.products;
    console.log("wish", wishlist);
  }

  let product = await db
    .get()
    .collection(collection.PRODUCT_COLLECTION)
    .find()
    .skip((page - 1) * limit)
    .limit(limit * 1)
    .sort({ _id: -1 })
    .toArray();
  productHelper.pageination(page, limit);

  res.render("user/view-products", {
    user,
    product,
    cartCount,
    wishCount,
    wishlist,
    currentPage:page,pageLimit,
  });
});

/////////////MEN////////////////
router.get("/mens", async function (req, res, next) {
  let user = req.session.user;

  let cartCount = null;
  let wishCount = null;
  let wishlist = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
    wishlist = await userHelpers.getWishProd(req.session.user._id);
    wishlist = wishlist?.products;
    console.log("wish", wishlist);
  }

  productHelper.getMenWatch().then((product) => {
    res.render("user/mens", { user, product, cartCount, wishCount, wishlist });
  });
});

router.get("/womens", async function (req, res, next) {
  let user = req.session.user;

  let cartCount = null;
  let wishCount = null;
  let wishlist = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
    wishlist = await userHelpers.getWishProd(req.session.user._id);
    wishlist = wishlist?.products;
    console.log("wish", wishlist);
  }

  productHelper.getWomenWatch().then((product) => {
    res.render("user/womens", {
      user,
      product,
      cartCount,
      wishCount,
      wishlist,
    });
  });
});

///////////////verify login//////////////////

// router.use(verifyLoggin)

router.get("/productDetails", async function (req, res) {
  let cartCount = null;
  let wishCount = null;
  let wishlist = null;
  let wishlists = null;
  if (req.session.user) {
    // wishlist =await userHelpers.getWishProd(req.session.user._id)
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
    wishlists = await userHelpers.getWishProd(req.session.user._id);
    wishlists = wishlist?.products;
  }

  let related = await db
    .get()
    .collection(collection.PRODUCT_COLLECTION)
    .find()
    .limit(4)
    .toArray();
  let productId = req.query.id;
  console.log("related", related);
  productHelper.getProductDetails(productId).then((product) => {
    console.log(product);
    res.render("user/product-details", {
      user: req.session.user,
      product,
      cartCount,
      wishCount,
      wishlist,
      wishlists,
      related,
    });
  });
});

router.get("/cart", verifyLoggin, async function (req, res) {
  let cartCount = null;
  let wishCount = null;

  cartCount = await userHelpers.getCartCount(req.session.user._id);
  wishCount = await userHelpers.getWishCount(req.session.user._id);

  try {
    let total = 0;
    await userHelpers
      .getCartProduct(req.session.user._id)
      .then(async (products) => {
        products.forEach((data) => {
          console.log("data", data);
          try {
            if (data.product.offerPrice) {
              data.subTotal =
                Number(data.quantity) * Number(data.product.offerPrice);
              // console.log(Number(data.product.offerPrice));
            } else {
              data.subTotal =
                Number(data.quantity) * Number(data.product.price);
            }
            total += data.subTotal;
          } catch (error) {
            data.subTotal = Number(data.quantity) * Number(data.product.price);

            total += data.subTotal;
          }
        });

        // let total = await userHelper.getTotalAmount(req.session.user._id);
        console.log("tot: ", total);
        res.render("user/cart", {
          products,
          total,
          user: req.session.user,
          cartCount,
          wishCount,
        });
      });
    // .catch((error)=>{

    //   res.redirect('/error')});
  } catch (err) {
    console.log(err, "hey");
    res.redirect("/error");
  }
});

router.get("/add-to-cart/:id", verifyLoggin, (req, res) => {

  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});

router.post(
  "/change-product-quantity",
  verifyLoggin,
  async (req, res, next) => {
    console.log(req.body);

    try {
      let price = 0;
      let offerPrice = 0;
      let total = 0;
      let productId = req.body.product;
      let quantity = req.body.quantity;
      let count = req.body.count;
      let diff = 0;
      console.log("count", count);
      productHelper
        .getProductDetails(req.body.product)
        .then((response) => {
          price = response.price;
          offerPrice = response?.offerPrice;
        })
        .catch(() => {
          console.log("in offer price");
          res.redirect("/error");
        });

      //-------------------------------------------------------------------

      await userHelpers.getMaxStock(productId).then(async (product) => {
        if (count <= 1) {
          if (Number(quantity) == Number(product.stock)) {
            res.json({ updation: false });
          } else {
            await userHelpers
              .changeProductQuantity(req.body)
              .then(async (response) => {
                let products = await userHelpers.getCartProduct(
                  req.session.user._id
                );
                userHelpers
                  .cartTotal(req.session.user._id, products)
                  .then((total) => {
                    // console.log("--------inc-----",total);

                    response.total = total;
                    response.price = price;
                    response.offerPrice = offerPrice;
                    response.updation = true;

                    res.json(response);
                  });
              });
          }
        } else {
          await userHelpers
            .changeProductQuantity(req.body)
            .then(async (response) => {
              let products = await userHelpers.getCartProduct(
                req.session.user._id
              );
              userHelpers
                .cartTotal(req.session.user._id, products)
                .then((total) => {
                  console.log("--------dec-----", total);

                  response.total = total;
                  response.price = price;
                  response.offerPrice = offerPrice;
                  // response.diff = total-offerPrice
                  response.updation = true;

                  res.json(response);
                });
            });
        }
      });
    } catch (err) {
      console.log(err);

      res.redirect("/login");
    }
  }
);

router.post("/delete-cart-product", verifyLoggin, (req, res, next) => {
  userHelpers.deleteCartProduct(req.query.id, req.body).then((response) => {
    res.json(response);
    // res.redirect('user/cart')
  });
});

////////Wsihlist//////////

router.post("/wish-list", async (req, res) => {
  try {
    console.log("in wish-list");
    userHelpers
      .wishList(req.body)
      .then((response) => {
        console.log(response);
        res.json(response);
      })
      .catch(() => {
        res.redirect("/error");
      });
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
});

router.get("/wishlist", verifyLoggin, async (req, res) => {
  try {
    let cartCount = null;
    let wishCount = null;

    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);

    let products = await userHelpers
      .getWishlist(req.session.user._id)
      .catch(() => {
        res.redirect("/error");
      });
    res.render("user/wishlist", {
      products,
      user: req.session.user._id,
      cartCount,
      wishCount,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
});

// router.get("/remove-wish", verifyLoggin, (req, res, next) => {
//   try {
//     userHelpers
//       .removeWish(req.session.user._id, req.query.id)
//       .then((response) => {
//         res.json({ status: true });
//       })
//       .catch(() => {
//         res.redirect("/error");
//       });
//   } catch (err) {
//     console.log(err);
//     res.redirect("/error");
//   }
// });
router.get("/remove-wishlist", verifyLoggin, (req, res, next) => {
  try {
    userHelpers
      .removeWish(req.session.user._id, req.query.id)
      .then((response) => {
        res.redirect("/wishlist");
      })
      .catch(() => {
        res.redirect("/error");
      });
  } catch (err) {
    console.log(err);
    res.redirect("/error");
  }
});

router.get("/add-to-wishlist/:id", verifyLoggin, (req, res) => {
  console.log(req.params.id);
  userHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});

router.post("/delete-wish-product", verifyLoggin, (req, res, next) => {
  console.log("in delete");
  console.log(req.body);
  console.log("delete-pro");
  userHelpers.deleteWishProduct(req.body).then((response) => {
    res.json(response);
    // res.redirect('user/cart')
  });
});

router.get("/check-wishlist", verifyLoggin, (req, res) => {
  userHelpers.checkWish(productId);
});

/////////////   checkout /////////////////

router.get("/checkout/", verifyLoggin, async (req, res) => {
  try {
    let cartCount = null;
    let wishCount = null;

    cartCount = await userHelpers.getCartCount(req.session.user._id);
    wishCount = await userHelpers.getWishCount(req.session.user._id);
    let total = 0;
    let products = await userHelpers.getCartProduct(req.session.user._id);
    products.forEach((data) => {
      try {
        if (data.product.offerPrice) {
          data.subTotal =
            Number(data.quantity) * Number(data.product.offerPrice);
        } else {
          data.subTotal = Number(data.quantity) * Number(data.product.price);
        }
        total += data.subTotal;
      } catch (error) {
        data.subTotal = Number(data.quantity) * Number(data.product.price);

        total += data.subTotal;
      }
    });
    let userId = req.query.id;
    let userDetails = await userHelpers.getUserDetails(userId);
    let address = await userHelpers.viewAddress(req.session.user._id);
    let wallet = await walletHelpers.getWallet(req.session.user._id);
    // console.log(wallet);
    let gwallet;
    if (wallet) {
      if (Number(wallet.wall_amount) >= Number(total)) {
        console.log("in wallet if ");
        gwallet = true;
      } else {
        console.log("in else wallet");
        gwallet = false;
      }
    }
    res.render("user/checkout", {
      total,
      user: req.session.user,
      userDetails,
      address,
      gwallet,
      cartCount,
      wishCount,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/error");
  }
});

router.post("/checkout", verifyLoggin, async (req, res) => {
  try {
    let products = await userHelpers.getCartProductList(req.session.user._id);

    let user = await userHelpers
      .getUserDetails(req.session.user._id)
      .catch(() => {
        res.redirect("/error");
      });
    let total =0;
    let offerPrice = 0;
    await userHelpers
      .getCartProduct(req.session.user._id)
      .then((products) => {
        products.forEach((data) => {
          try {
            if (data.product.offerPrice) {
              data.subTotal =
                Number(data.quantity) * Number(data.product.offerPrice);
                // console.log("--------",Number(data.product.offerPrice));
              // offerPrice=
              console.log("data.sub",data.subTotal);
            } else {
              data.subTotal =
                Number(data.quantity) * Number(data.product.price);
                console.log("in else");
            }
      
            total = total + data.subTotal;
            console.log("total-----------",total);
          } catch (error) {
            console.log("in catch");
            data.subTotal = Number(data.quantity) * Number(data.product.price);
            offerPrice += data.subTotal;
          }
          if (req.body.coupon) {
            let off = Number(req.body.coupon);
            total = total - total * (off / 100);
          }
          console.log("-------------------off",total);
        });
      })
      .catch(() => {
        res.redirect("/error");
      });

    let totalPrice = await userHelpers.getTotalAmount(req.body.userId);
    req.body.UserId = req.session.user._id;
    console.log("total",totalPrice);
    console.log("off",total);
    await userHelpers
      .placeOrder(
        req.body,
        products,
        total,
        totalPrice,
        req.session.user._id
      )
      .then((orderId) => {
        if (req.body["payment-method"] === "COD") {
          console.log("cod");
          res.json({ cod_success: true });
        } else if (req.body["payment-method"] === "paypal") {
          console.log("pay");
          res.json({ cod_success: true });
        } else if (req.body["payment-method"] === "Wallet") {
          userHelpers.buyWallet(orderId).then((response) => {
            console.log({ response });
            if (response == true) {
              console.log("in respor true");
              res.json({ wallet_success: true });
            } else {
              console.log(" else");
              res.json({ wallet_fail: true });
            }
          });
        } else {
          userHelpers
            .generateRazorPay(orderId, totalPrice, offerPrice)
            .then((response) => {
              console.log("resop:", response);
              res.json(response);
            });
        }
      })
      .catch(() => {
        res.redirect("/orderSuccessfully");
      });
  } catch (err) {
    console.log(err);
    res.redirect("/error");
  }
});

router.post("/verify-payment", (req, res) => {
  console.log(req.body);
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        console.log("payment sucessfull");
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false, errMsg: "payment failed" });
    });
});

router.get("/orderSucessfull", verifyLoggin, async (req, res) => {
  let userId = req.query.id;
  let cartCount = null;
  let wishCount = null;

  cartCount = await userHelpers.getCartCount(req.session.user._id);
  wishCount = await userHelpers.getWishCount(req.session.user._id);
  let userDetails = await userHelpers.getUserDetails(userId);

  res.render("user/orderSucessfull", {
    user: req.session.user,
    userDetails,
    cartCount,
    wishCount,
  });
});

///////////////////Order histroy //////////////////////

router.get("/order-history", verifyLoggin, async (req, res) => {
  let cartCount = null;
  let wishCount = null;

  cartCount = await userHelpers.getCartCount(req.session.user._id);
  wishCount = await userHelpers.getWishCount(req.session.user._id);
  let pro = userHelpers.getOrderProducts(req.session.user._id);
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  orders.forEach((element) => {
    if (element.status == "Delivered") {
      element.delivered = true;
    } else if (element.status == "Shipped") {
      element.shipped = true;
    } else if (element.status == "Cancelled") {
      element.cancelled = true;
    } else if (element.status == "Return") {
      element.Return = true;
    }
  });
  res.render("user/order-history", {
    user: req.session.user,
    orders,
    pro,
    cartCount,
    wishCount,
  });
});

//////////////////////////Cancel Order ////////////////////////////

router.get("/cancel-order/:data", verifyLoggin, async (req, res) => {
  await userHelpers.cancelOrder(req.body, req.params.data).then((response) => {
    res.redirect("/order-history");
  });
});

//////////////////////////Retrun Order //////////////////////////

router.get("/return-order/:data", verifyLoggin, async (req, res) => {
  await userHelpers.returnOrder(req.body, req.params.data).then((response) => {
    res.redirect("/order-history");
  });
});


router.get("/prooooo/:id", verifyLoggin, async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id);

  let order = await userHelpers.getvViewOrders(
    req.session.user._id,
    req.params.id
  );

  if (order.status == "placed") {
    order.placed = true;
  } else if (order.status == "Placed") {
    order.placed = true;
  } else if (order.status == "pending") {
    order.pending = true;
  } else if (order.status == "Shipped") {
    order.shipped = true;
  } else if (order.status == "Delivered") {
    order.delivered = true;
  } else if (order.status == "Cancelled") {
    order.return = true;
  } else {
    order.return = true;
  }

  res.render("user/prooooo", {
    user: req.session.user,
    products,
    order,
    id: req.params.id,
    noPartial:true
  });
  // console.log("pro", products);
});

///////////////////////PROFILE ?///////////////////////////////

router.get("/user-profile", verifyLoggin, async (req, res) => {
  let cartCount = null;
  let wishCount = null;

  cartCount = await userHelpers.getCartCount(req.session.user._id);
  wishCount = await userHelpers.getWishCount(req.session.user._id);
  console.log("in get");
  res.render("user/user-profile", {
    user: req.session.user,
    profile: true,
    passErr: req.session.changePasswordError,
    success: req.session.success,
    failed: req.session.failed,
    cartCount,
    wishCount,
  });
  req.session.changePasswordError = null;
  req.session.success = null;
  req.session.failed = null;
});

router.post("/user-profile", async (req, res) => {
  console.log("in post");
  console.log("body", req.body);
  await userHelpers.updateUser(req.session.user, req.body).then(() => {
    req.session.user.Name = req.body.Name;
    req.session.user.number = req.body.number;
    res.redirect("/user-profile");
  });
});

/////////////////////    Address    ///////////////////////

router.get("/add-address", verifyLoggin, async (req, res) => {
  address = await userHelpers.viewAddress(req.session.user._id);
  res.render("user/add-address", {
    user: req.session.user,
    profile: true,
    address,
  });
});

router.post("/add-address", verifyLoggin, async (req, res) => {
  console.log("address",req.body);
  await userHelpers.addAddress(req.session.user._id, req.body).then(() => {
    res.redirect("/add-address");
  });
});

router.post("/edit-address", verifyLoggin, async function (req, res) {
  let id = req.query.id;
  await userHelpers.updateAddress(id, req.body).then(() => {
    res.redirect("/add-address");
    console.log(req.query.id);
  });
});

router.get("/edit-address", verifyLoggin, async function (req, res) {
  let userId = req.query.id;
  let address = await userHelpers.getUserAddress(req.query.id);
  // console.log(user);
  res.render("user/edit-address", { address, user: req.session.user });
});


router.get("/delete-address", verifyLoggin, function (req, res) {
  let userId = req.query.id;
  userHelpers.deleteAddress(userId).then((response) => {
    res.redirect("/add-address");
  });
});

/////////////////CAHANGE PASSWORD////////////////

router.post("/changePass", verifyLoggin, async function (req, res) {
  // if(req.session.loggedIn){
  console.log(req.body);

  let userId = req.session.user._id;

  let enteredPassword = req.body.password;
  let newPassword = req.body.newPassword;
  let confirmPassword = req.body.confirmPassword;

  console.log("new:", newPassword);
  console.log("conform", confirmPassword);
  console.log(enteredPassword);

  if (newPassword == confirmPassword) {
    let userdetails = await userHelpers.getUserDetails(userId);

    console.log(userdetails);
    let status = bcrypt.compare(enteredPassword, userdetails.Password);

    if (status) {
      userHelpers.changePassword(userId, newPassword).then((response) => {
        req.session.success = true;
        res.redirect("/user-profile");
        // res.json({status:true})
      });
    } else {
      req.session.failed = true;

      res.redirect("/user-profile");
    }
  } else {
    req.session.changePasswordError = "entered wrong password";
    res.redirect("/user-profile");
  }

  // }
});

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

/////////////////Download Invoice/////////////////

router.get("/invoice/:id", verifyLoggin, async function (req, res) {
  let products = await userHelpers.getOrderProducts(req.params.id);
  console.log(products);

  let order = await userHelpers.getvViewOrders(
    req.session.user._id,
    req.params.id
  );
  if (order.status == "placed") {
    order.placed = true;
  } else if (order.status == "pending") {
    order.pending = true;
  } else if (order.status == "Shipped") {
    order.shipped = true;
  } else if (order.status == "Delivered") {
    order.delivered = true;
  } else if (order.status == "Cancelled") {
    order.return = true;
  } else {
    order.return = true;
  }

  res.render("user/invoice", {
    user: req.session.user,
    products,
    order,
    id: req.params.id,
    noPartial: true,
  });
  console.log("pro", products);
});

/////////////////Wallet////////////
router.get("/wallet", verifyLoggin, async (req, res) => {
  let total = 0;

  userId = req.session.user._id;
  let amount = await walletHelpers.getWallet(req.session.user._id);

  console.log(amount);
  walletHelpers.getWalletTrans(req.session.user._id).then((wallet) => {
    res.render("user/wallet", { user: req.session.user, wallet, amount });
  });
});

//////////////////Sort By////////////////////

router.get("/view-products/popularity", async (req, res) => {
  productHelper.pupularityPro().then((product) => {
    res.render("user/view-products", { product });
  });
});
router.get("/view-products/lowTOhigh", async (req, res) => {
  productHelper.lowToHigh().then((product) => {
    console.log("in viewo ro");
    res.render("user/view-products", { product });
  });
});
router.get("/view-products/hightTOlow", async (req, res) => {
  productHelper.hightTolow().then((product) => {
    res.render("user/view-products", { product });
  });
});

////////////Apply coupon////////////////

router.post("/applyCoupon", verifyLoggin, async (req, res) => {
  let { promo } = req.body;
  console.log("promo", promo);
  couponHelpers
    .verifyCoupon(promo, req.session.user._id)
    .then((coupon) => {
      console.log("copu: ", coupon);

      res.json({ coupon, status: true });
    })
    .catch((err) => {
      res.json({ status: false });
    });
});

/////////Coupon///////

router.get("/view-coupon", verifyLoggin, async (req, res) => {
  let cartCount = null;
  let wishCount = null;
  let coupon = null;

  cartCount = await userHelpers.getCartCount(req.session.user._id);
  wishCount = await userHelpers.getWishCount(req.session.user._id);
  let orderCount = await db
    .get()
    .collection(collection.ORDER_COLLECTION)
    .countDocuments({ userId: objectId(req.session.user._id) });
  console.log(coupon);
  couponHelpers.getCoupons().then((coupon) => {
    res.render("user/view-coupon", {
      coupon,
      cartCount,
      wishCount,
      orderCount,
    });
  });
});

module.exports = router;
