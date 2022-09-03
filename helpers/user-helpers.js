var db=require('../config/connection')
var collection = require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('express')
var objectId = require('mongodb').ObjectId

module.exports={
    doSignup:function(userData) {
        return new Promise(async function (resolve, reject) {
            var isThere = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (isThere) {
                resolve(false)
            } else {
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
                            resolve({status})
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

    getAllUsers:() => {
        return new Promise (async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            console.log(users +'\n helo')
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
         console.log(session);
         blocked = false;
        if(userDetails.blocked == 'true'){
        
            session.user=null
            session.loggedIn=null
            session.loginErr=null
            blocked = true;
        }
        // console.log(userDetails)
        return new Promise(async(resolve, reject) => {

                userDetails.Password = await bcrypt.hash(userDetails.Password, 10); 
                db.get().collection(collection.USER_COLLECTION)
                    .updateOne({Email:userDetails.Email}, {
                        $set: {
                            // Name: userDetails.Name,
                            // number:userDetails.number,
                            // // Email:userDetails.Email,
                            // Password: userDetails.Password,
                            blocked: userDetails.blocked
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
    addToCart:(productId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                    $push:{products:objectId(productId)}
                }
                ).then((response)=>{
                    resolve()
                })
            }
            else{
                let cartObj = {
                    user:objectId(userId),
                    products:[objectId(productId)]
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
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        let:{proList:'$products'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id',"$$proList"]
                                    }
                                }
                            }
                        ],
                        as:'cartItems'
                    }
                 }
            ]).toArray()
            resolve(cartItems[0].cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            // if(cart){
                count=cart.products.length;
            // }
            resolve(count)
        })
    }
}