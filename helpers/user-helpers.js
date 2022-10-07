var db=require('../config/connection')
var collection = require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('express')
const { PRODUCT_COLLECTION } = require('../config/collections')
var objectId = require('mongodb').ObjectId

const Razorpay = require('razorpay');
const { resolve } = require('path')
const { resolveObjectURL } = require('buffer')
const walletHelpers = require('./wallet-helpers')
const couponHelpers = require('./coupon-helpers')
const shortid = require('shortid')
// import fetch from "node-fetch";
// import "dotenv/config"; // loads env variables from .env file

var instance = new Razorpay({
  key_id: 'rzp_test_t1yn2Ez97FhcF6',
  key_secret: '66pHj3iP59aS2XaME3FLPOG6',
});






module.exports={
    doSignup:function(userData) {
        return new Promise(async function (resolve, reject) {
            console.log("usd: ",userData);
          
            let isThere = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            let isref = 'a'
            console.log(userData.referal_code);
            if(userData.referal_code){

              isref = await db.get().collection(collection.USER_COLLECTION).findOne({referal_code:userData.referal_code})
              
            }
            if(isref){
                  wallet= await db.get().collection(collection.WALLET_COLLECTION).findOne({userId:objectId(isref._id)})
                
                
                console.log("userid: ",isref._id);
                var today = new Date();
                var dd = String(today.getDate()).padStart(2, '0');
                var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                var yyyy = today.getFullYear();
            
                today = mm + '-' + dd + '-' + yyyy;
                date=today
                walletobj = {
                    transactionamount: 100,
                    isDebit:false,
                    date: date,
                    message:'credited for referal !'
                }
                
                db.get()
                .collection(collection.WALLET_COLLECTION)
                .updateOne(
                  { userId: isref._id },
                  {
                    $push: { walletobj },
                  }
                ).then(()=>{

                // console.log("id",{objectId(isref._id)});
                let total = Number(wallet.wall_amount)+ 100;
                db.get().collection(collection.WALLET_COLLECTION).updateOne({userId:objectId(isref._id)},{
                    $set:{
                        wall_amount:total
                    }
                })
            })
        
            }else{
                resolve("invalid referal")
            }
            console.log(isref);
            if (isThere) {
                resolve(false)
            } 
            else {
                // let wallet = 0
                let referal_code = shortid.generate()
                userData.referal_code =referal_code
                // userData.wallet=wallet
                userData.Password = await bcrypt.hash(userData.Password, 10);
                userData.blocked = false;
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    // console.log(data);
                    resolve(data)
                })
            }
        })    
    },
    doLogin:function(userData) {
        return new Promise (async (resolve, reject) => {
            let loginStatus=false
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user) {
                console.log(user);
                if(user.blocked == true){
                    console.log("blocked");
                    resolve("blocked")
                }
                else{
                    
                    bcrypt.compare(userData.Password, user.Password).then((status) => {
                        if(status){
                            console.log("login success");
                            response.user=user
                            response.status=true
                            resolve(response)
                        }else{
                            console.log("login failed");
                            resolve()
                        }
                    })
                }
                // console.log(user.Password);
            }else{
                console.log("no user");
                resolve(false)
            }
        })
    },

    findTheUser:(number)=>{
        return new Promise(async(resolve,reject)=>{
            var is_valid= null;
            var account=await db.get().collection(collection.USER_COLLECTION).findOne({number:number})
            console.log(account)
            if(!account){
                resolve("no account")
            }else if(account.blocked){
                is_valid = "user blocked"
                console.log("user is blocked");
            }else{
                console.log("eveidethi")
                is_valid='failed'
                resolve(account)
            }
        })
    },

    getAllUsers:() => {
        return new Promise (async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            // console.log(users +'\n helo')
            resolve(users)
        })
    },
    deleteUser:(userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).deleteOne({_id:objectId(userId)}).then((response) => {
                // console.log(response);
                resolve(response)
            })
        })
    },
    getUserDetails:(userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((user) => {
                resolve (user)
            })
        })
    },
    blockUser:(userId)=> {
        return new Promise(async(resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne(
                    {_id:objectId(userId)},
                    {$set: {blocked: true}}
                    ).then((response) => {
                    resolve()
                })
    })
    },
    unblockUser:(userId) => {
        return new Promise(async(resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({_id:objectId(userId)}, {
                    $set: {
                        blocked: false
               }}).then((response) => {
                    console.log(response);
                    resolve()
                })
    })
    },
    updateUser:(userId, userDetails,session) => {
         console.log("in updateUser");
         console.log("userD:",userDetails);

        // console.log(userDetails)
        return new Promise(async(resolve, reject) => {

                // userDetails.Password = await bcrypt.hash(userDetails.Password, 10); 
                db.get().collection(collection.USER_COLLECTION)
                    .updateOne({Email:userDetails.Email}, {
                        $set: {
                            Name: userDetails.Name,
                            number:userDetails.number,

                        }
                    }).then((response) => {
                        console.log(response);
                        resolve()
                    })
                
            // } else {
            //     console.log("Cant update user")
            //     resolve(false);
            // }
        })
    },
    addToCart:(productId,userId)=>{
        let proObj={
            item:objectId(productId),
             quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=>product.item==productId)
                console.log((proExist));
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId),'products.item':objectId(productId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }).then(()=>{
                        resolve()
                    })
                }
                else{

                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                    {
                        $push:{products:proObj}
                    }
                    ).then((response)=>{
                        resolve()
                    })
                }
            }
            else{
                let cartObj = {
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },

    getCartProduct:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                 {
                    $match:{user:objectId(userId)}
                 },
                 {
                    $unwind:'$products'
                 },
                 {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                 },
                 {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                 },
                 {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                 }

            ]).toArray()
            // console.log(cartItems);
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count=cart.products.length;
            }
            resolve(count)
        })
    },


    getOrderPro:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            try{
                let orderItems=await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match:{_id:objectId(userId)}
                    },
                    {
                        $unwind:"$cartItems",
                    },
                    {
                        $lookup:{
                            from:PRODUCT_COLLECTION,
                            localField:"cartItems.productId",
                            foreignField:"_id",
                            as:"product",
                        },
                    },
                    {
                        $unwind:"$product"
                    },

                ]).then((data)=>{
                    console.log(data);
                    resolve(data)
                })
            }catch(error){
                console.error(error);
            }
        })
    },

    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        
        return new Promise((resolve,reject)=>{
           
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }).then((response)=>{
                    resolve({removeProduct:true})
                })

            }else{
                console.log("chagnge product");                
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                {         
                    
                   $inc:{'products.$.quantity':details.count}

                }).then((response)=>{

                    resolve({status:true})
                })
            }
        })
    },

    getTotalAmount:(userId)=>{
        console.log(userId);
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                 {
                    $match:{user:objectId(userId)}
                 },
                 {
                    $unwind:'$products'
                 },
                 {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                 },
                 {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                 },
                 {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                 },
                 {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:[{$toInt:'$quantity'},{$toInt:'$product.price'}]}}
                    }
                 }

            ]).toArray()
            // console.log(total[0].total);
            if (total == "") {
                resolve();
              } else {
                resolve(total[0].total);
              }
        })
    },
    getOfferTotalAmount:(userId)=>{
        console.log(userId);
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                 {
                    $match:{user:objectId(userId)}
                 },
                 {
                    $unwind:'$products'
                 },
                 {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                 },
                 {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                 },
                 {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                 },
                 {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:[{$toInt:'$quantity'},{$toInt:'$product.offerPrice'}]}}
                    }
                 }

            ]).toArray()
            // console.log(total[0].total);
            if (total == "") {
                resolve();
              } else {
                resolve(total[0].total);
              }
        })
    },
    


      deleteCartProduct: (product,details) => {
        
        console.log(details);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(product)}}
            }).then((response)=>{
                console.log("res",response);
                resolve({removeProduct:true})
            })
        });
      },



  



    placeOrder:(order,products,offerPrice,totalPrice,userId)=>{
    
        return new Promise(async(resolve,reject)=>{
            let {couponId} = order;
            console.log("id",couponId);
            console.log("userid",userId);

            var today = new Date();
            var orderDate= new Date()
            var dd = String(orderDate.getDate()).padStart(2, '0');
            var mm = String(orderDate.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = orderDate.getFullYear();
            
            orderDate = mm + '-' + dd + '-' + yyyy;
            order.Date=orderDate
            // let date = new Date()

            if(couponId){
                // let couponUsed = await couponHelpers.verifyCoupon()
                // console.log("usedcou",couponUsed);
                await couponHelpers.usedCoupon(couponId,userId).then((data)=>{
                    console.log(data);
                })
            }




            let status = order["payment-method"] === "COD" || order["payment-method"] === "paypal" ? "placed" : "pending";
            let orderObj
            if(order.offerp==totalPrice){
                orderObj={
                    delivery_details:{
                        date:order.Date,
                        name:order.name,
                        // mobile:order.number,
                        address:order.address,
                        // city:order.city,
                        // state:order.state,
                        // pin:order.pin,
                        
                    },
                    // address:objectIdorder.address,
                    userId:objectId(order.userId),
                    paymentMethod:order['payment-method'],
                    products:products,
                    totalAmount:totalPrice,
                    // offerPrice:order.offerp,
                    status:status,
                    date:today
                    // date:date,
                    
                }
            }else{

                orderObj={
                    delivery_details:{
                        date:order.Date,
                        name:order.name,
                        // mobile:order.number,
                        address:order.address,
                        // city:order.city,
                        // state:order.state,
                        // pin:order.pin,
                        
                    },
                    // address:objectIdorder.address,
                    userId:objectId(order.userId),
                    paymentMethod:order['payment-method'],
                    products:products,
                    totalAmount:totalPrice,
                    offerPrice:order.offerp,
                    status:status,
                    date:today
                    // date:date,
                    
                }
            }
            // cart=db.get().collection(collection.CART_COLLECTION).find({user:objectId(order.userId)})
            // console.log("cart: ",cart);
            // db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:orderObj.products},{$inc:{stock:products.quantity}})
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                // db.get().collection(collection.PRODUCT_COLLECTION)
                

                db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                console.log("oder id:",response.insertedId);
                resolve(response.insertedId)
            })
        })

    },


    orderPlace: (order, products, totalPrice) => {
        return new Promise((resolve, reject) => {
          try {
        
          let status = order["payment-method"] === "COD" || order["payment-method"] === "paypal" ? "placed" : "pending";
    
          let orderObj = {
            deliveryDetails: {
              address: order.address,
              Date: new Date(),
            },
            userId: objectId(order.UserId),
            payment_Method: order["payment-method"],
            status: status,
            totalAmount: totalPrice,
            products: products,
          };
    
          db.get()
            .collection(collections.ORDER_COLLECTION)
            .insertOne(orderObj)
            .then((response) => {
              db.get()
                .collection(collections.CART_COLLECTION)
                .removeOne({
                  user: objectId(order.UserId)
                });
    
              resolve(response.ops[0]._id);
            });
                
          } catch (error) {
            reject()
          }
        });
      },



    getCartProductList:(userId)=>{
        try{

            return new Promise(async(resolve,reject)=>{
    
                let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
                
                resolve(cart.products)
                
            })
        }catch(err){

            resolve('no')
        }
    },


    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders= await db.get().collection(collection.ORDER_COLLECTION)
              .find({userId:objectId(userId)}).sort({"date":-1}).toArray()
           
            resolve(orders)
        })
    }, getvViewOrders:(userId,orderid)=>{
        console.log("-------------------------",orderid);
        return new Promise(async(resolve,reject)=>{
            let orders= await db.get().collection(collection.ORDER_COLLECTION)
              .findOne({userId:objectId(userId),_id:objectId(orderid)})
           
            resolve(orders)
        })
    },
    getAllUserOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let userPro= await db.get().collection(collection.ORDER_COLLECTION).find().sort({date:-1}).toArray()
            console.log(userPro);
                resolve(userPro)
           
        
        })
    },
    getAllDeliveredOrder:()=>{
        return new Promise(async(resolve,reject)=>{
            let report= await db.get().collection(collection.ORDER_COLLECTION).find({status:"Delivered"}).toArray()
            console.log("repo",report); 
                resolve(report)
        })
    },


    getOrderProducts:(orderId)=>{
        console.log('in get order products');
        console.log(orderId)
        return new Promise(async(resolve,reject)=>{
            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                 {
                    $match:{_id:objectId(orderId)}
                 },
                 {
                    $unwind:'$products'
                 },
                 {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                 },
                 {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                 },
                 {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                 },


            ]).toArray()
            console.log(orderItems);
            resolve(orderItems)
        })
    },

    updateStatus:(body,details)=>{


        return new Promise((resolve,reject)=>{

            
            // console.log('in updateStatus');
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(details)},
            {
                $set:{
                    status:body
                }
                
                
                
            }).then((response)=>{
                resolve()
                console.log(details);
             console.log('in updateStatus');
        })
        })
    },
    
    cancelOrder:(body,details)=>{
       
            return new Promise((resolve,reject)=>{
         
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(details)},
                {
                    $set:{
                        status:'Cancelled'
                    }
                                    
                }).then((response)=>{
                    console.log();
                    db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(details)}).then((order) => {
                        console.log("order",order);
                        if(order.status == "Cancelled" || order.status == "Return"){
                            console.log("inside if");
                            let price =0
                            if(order.offerPrice){
                                price={
                                    wall_amount:order.offerPrice
                                }
                            }else{

                                price = {
                                    wall_amount: order.totalAmount
                                }
                            }
                            console.log(price,"price");
                            walletHelpers.addtoWallet(price,order.userId)
                        }
                    })
                    resolve()
                    console.log(details);
                 console.log('in updateStatus');
            })
            })
   
},

    returnOrder:(body,details)=>{


        return new Promise((resolve,reject)=>{

            
            
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(details)},
            {
                $set:{
                    status:'Cancelled'
                }
                
                
                
            }).then((response)=>{
                console.log();
                db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(details)}).then((order) => {
                    console.log("order",order);
                    if(order.status == "Cancelled" || order.status == "Return"){
                        console.log("inside if");
                        let price =0
                            if(order.offerPrice){
                                price={
                                    wall_amount:order.offerPrice
                                }
                            }else{

                                price = {
                                    wall_amount: order.totalAmount
                                }
                            }
                        console.log(price,"price");
                        walletHelpers.addtoWallet(price,order.userId)
                    }
                })
                resolve()
                console.log(details);
             console.log('in updateStatus');
        })
        })
    },


    addAddress:(userId,userDetails)=>{
        

        userDetails.userId = userId
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADDRESS_COLLECTION)
            .insertOne(

                    userDetails
                    // userId:userId
                
            ).then((response)=>{
                resolve(response)
                
            })
        })
     
    },

    viewAddress:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADDRESS_COLLECTION).find({userId:userId}).toArray().then((data) => {

                resolve(data)
            })
        })
    },

    getUserAddress:(userId) => {
        return new Promise(async(resolve, reject) => {
            let address=await db.get().collection(collection.ADDRESS_COLLECTION).findOne({_id:objectId(userId)})

                console.log(address);
                resolve(address)
         
        })
    },

    updateAddress:(userId, userDetails) => {

       return new Promise(async(resolve, reject) => {

               db.get().collection(collection.ADDRESS_COLLECTION).updateOne( {_id:objectId(userId)},
                    {
                       $set: {
                           name: userDetails.name,
                           phone:userDetails.phone,  
                           country: userDetails.country,
                           address: userDetails.address,
                           city:userDetails.city,
                           state:userDetails.state,
                           pin:userDetails.pin
                       }
                   }).then((response) => {
                    console.log(response);
                       resolve()
                   })   
    
       })
   },

   deleteAddress:(addId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({_id:objectId(addId)}).then((response)=>{
            resolve(response)
        })
    })
   },

// comparePass:(userId)=>{
//     return new Promise(async(resolve,reject)=>{
//              let user= await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
//              bcrypt.compare(userId.Password, user.Password).then((status) => {
//                 resolve()
//             })
//         })
         
//     },


changePassword:(userId,newPassword)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).updateOne(
            {_id:objectId(userId)},
            {
                $set:{
                    Password:bcrypt.hashSync(newPassword,10),
                }
            }
        ).then((response)=>{
            resolve()
        })
    })
},

// totalAmountChart:()=>{
//     return new Promise(async(resolve,reject)=>{
//         let pro=await db.get().collection(collection.ORDER_COLLECTION).find({totalAmount:1}).toArray()
//     })
// }




// getAllUserOrders:()=>{
//     return new Promise(async(resolve,reject)=>{
//         let userPro= await db.get().collection(collection.ORDER_COLLECTION).find().toArray()

//             resolve(userPro)
       
    
//     })
// },

/////////////////////////////PAYMENT///////////////////


generateRazorPay:(orderId,total,offer)=>{
    return new Promise((resolve,reject)=>{
        var options=0
        if(offer){

            options={
                amount:offer*100,
                currency:"INR",
                receipt:""+orderId
            };
        }else{
            options={
                amount:total*100,
                currency:"INR",
                receipt:""+orderId
            };
        }
        instance.orders.create(options, function (err, order) {
            if (err) {
              console.log(err);
    
              reject(err);
            } else {
                console.log("new orde:",order);
              resolve(order);
            
            }
        })
    })
},

verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
        crypto = require('crypto');
        hmac=crypto.createHmac('sha256','66pHj3iP59aS2XaME3FLPOG6')
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
        hmac=hmac.digest('hex')
        if(hmac==details['payment[razorpay_signature]']){
            resolve()
        }else{
            reject()
        }
    })
},    
changePaymentStatus:async (orderId)=>{
    await new Promise((resolve, reject) => {
        db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
        {
            $set:{
                status: 'placed'
            }
        }
        ).then(()=>{
            resolve()
        })
    })
    
},

////////////////////PayPal/////////////

//  generatePayPal:async()=> {
//     const accessToken = await generateAccessToken();
//     const url = `${base}/v2/checkout/orders`;
//     const response = await fetch(url, {
//       method: "post",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${accessToken}`,
//       },
//       body: JSON.stringify({
//         intent: "CAPTURE",
//         purchase_units: [
//           {
//             amount: {
//               currency_code: "INR",
//               value: "100.00",
//             },
//           },
//         ],
//       }),
//     });
//     const data = await response.json();
//     console.log(data);
//     return data;
//   },


   capturePayment:async(orderId)=> {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderId}/capture`;
    const response = await fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    console.log(data);
    return data;
  },
  
  generateAccessToken: async()=> {
    const response = await fetch(base + "/v1/oauth2/token", {
      method: "post",
      body: "grant_type=client_credentials",
      headers: {
        Authorization:
          "Basic " + Buffer.from(CLIENT_ID + ":" + APP_SECRET).toString("base64"),
      },
    });
    const data = await response.json();
    return data.access_token;
  },



  /////////////////end of Paypal/////////////////////

  editUser:(userId, userDetails,session) => {
    console.log(userDetails);

   // console.log(userDetails)
   return new Promise(async(resolve, reject) => {

        
           db.get().collection(collection.USER_COLLECTION)
               .updateOne({Email:userDetails.Email}, {
                   $set: {
                       Name: userDetails.Name,
                       number:userDetails.number,
                       // Email:userDetails.Email,
                       // Password: userDetails.Password,

                       address: userDetails.address,
                       city:userDetails.city,
                       state:userDetails.state,
                       pin:userDetails.pin
                   }
               }).then((response) => {
                   resolve()
               })
           
       // } else {
       //     console.log("Cant update user")
       //     resolve(false);
       // }
   })
},

/////////coupon/////////////
buyWallet: function (orderId) {
    return new Promise((resolve, reject) => {
        
        db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)}).then((order) => {
            db.get().collection(collection.WALLET_COLLECTION).findOne({userId: order.userId}).then((wallet) => {
                var today = new Date();
                var dd = String(today.getDate()).padStart(2, '0');
                var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                var yyyy = today.getFullYear();
            
                today = mm + '-' + dd + '-' + yyyy;
                date=today
                let totalAmount=0
                if(order.offerPrice){
                    totalAmount=order.offerPrice
                }else{
                    totalAmount=order.totalAmount
                }
                if(totalAmount <= wallet.wall_amount) {
                    totalAmount=Number(totalAmount)
                    walletobj = {
                        transactionamount: totalAmount,
                        isDebit:true,
                        date: date,
                        message:'debited for buying the product'
                    }
                    db.get()
                      .collection(collection.WALLET_COLLECTION)
                      .updateOne(
                        { userId: order.userId },
                        {
                          $push: { walletobj },
                        }
                      )
                      .then(() => {
                        wallet.wall_amount = wallet.wall_amount - order.totalAmount;
                        db.get()
                          .collection(collection.WALLET_COLLECTION)
                          .updateOne(
                            { userId: order.userId },
                            {
                              $set: {
                                wall_amount: wallet.wall_amount,
                              },
                            }
                          )
                          .then(async () => {
                            let data = await db
                              .get()
                              .collection(collection.ORDER_COLLECTION)
                              .updateOne(
                                { _id: objectId(orderId) },
                                {
                                  $set: {
                                    status: "placed",
                                  },
                                }
                              );
                            console.log({ data });
                            resolve(data);
                            // .then((data) => {
                            //     console.log("Data",data);
                            //     resolve(true)
                            // })
                          });
                      });
                   
                }
                // } else {
                //     resolve(false)
                // }
            })
        })
    })
},

  ////// WISHLIST//////////////
  addToWishlist:(productId,userId)=>{
    let proObj={
        item:objectId(productId),
    }

    return new Promise(async(resolve,reject)=>{
        let wishCart = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:objectId(userId)})
        if(wishCart){

            let proExist = wishCart.products.findIndex(product=>product.item==productId)

            if(proExist!=-1)
            {
                db.get().collection(collection.WISHLIST_COLLECTION).updateOne({user:objectId(userId)},
                {
                    $pull:{products:proObj}
                }
                
                ).then((response)=>{
                    console.log('deleted');
                    resolve()
                })
            }else{
                db.get().collection(collection.WISHLIST_COLLECTION).updateOne({user:objectId(userId)},
                {
                    $push:{products:proObj}
                }
                ).then((response)=>{
                    resolve()
                })
            }


        }
        else{
            let wishObj = {
                user:objectId(userId),
                products:[proObj]
            }
           
            db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response)=>{
                resolve()
            })
        }
    })
},
getWishPro:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let wishItems=await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item'
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,
                    product:{
                        $arrayElemAt:['$product',0]
                    }
                }
            }
           
        ]).toArray()
        console.log(wishItems);
        resolve(wishItems)
    })
},


getWishCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let count=0
        let wish= await db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:objectId(userId)})
        if (wish){
            count = wish.products.length
        }
        resolve(count)
    })
},

deleteWishProduct: (details) => {
    
    return new Promise((resolve, reject) => {
        db.get().collection(collection.WISHLIST_COLLECTION)
        .updateOne({_id:objectId(details.wish)},
        {
            $pull:{products:{item:objectId(details.product)}}
        }).then((response)=>{
            resolve({removeProduct:true})
        })
    });
  },



  checkWish:(userId,productId)=>{

  },

wishList: (details) => {
    return new Promise(async (resolve, reject) => {
        console.log("det",details.user);
      try {
      
      let wish = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({
          user: objectId(details.user)
        });

      if (wish) {
        let prod = wish.products.findIndex(
          (products) => products == details.proId
        );
        if (prod != -1) {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne({
              user: objectId(details.user)
            }, {
              $pull: {
                products: objectId(details.proId)
              },
            })
            .then(() => {
              resolve({
                status: false
              });
            });
        } else {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne({
              user: objectId(details.user)
            }, {
              $push: {
                products: objectId(details.proId)
              },
            })
            .then(() => {
              resolve({
                status: true
              });
            });
        }
      } else {
        let wishObj = {
          user: objectId(details.user),
          products: [objectId(details.proId)],
        };
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(wishObj)
          .then(() => {
            resolve({
              status: true
            });
          });
      }
        
    } catch (error) {
        reject()
    }
    });
  },
  getWishlist: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
     
      let wishList = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([{
            $match: {
              user: objectId(userId)
            },
          },
          {
            $unwind: "$products",
          },

          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "products",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              product: {
                $arrayElemAt: ["$products", 0]
              },
            },
          },
        ])
        .toArray();

      resolve(wishList);
         
    } catch (error) {
        reject()
    }
    });
  },
  removeWish: (user, pro) => {
    return new Promise((resolve, reject) => {
        console.log("user",user);
        console.log(pro);
      try {
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .updateOne({
            user: objectId(user)
          }, {
            $pull: {
              products: objectId(pro)
            },
          })
          .then(() => {
            resolve();
          }).catch((err) => {
            reject(err)
          });
      } catch (error) {
        console.log('product not existing');
        reject()
      }



    });
  },
  getWishProd: (user) => {
    return new Promise(async (resolve, reject) => {
    //   try {
      
      let prods = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({
          user: objectId(user)
        });
      resolve(prods);
        
    // } catch (error) {
    //     reject()
    // }
    });
  },

}


