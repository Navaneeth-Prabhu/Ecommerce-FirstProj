var db=require('../config/connection')
var collection = require('../config/collections');

var objectId = require('mongodb').ObjectId
var bcrypt = require('bcrypt');
const { response } = require('express');
const collections = require('../config/collections');



module.exports = {


  getCoupons: () => {
    return new Promise(async (resolve, reject) => {

        let coupons = await db
          .get()
          .collection(collections.COUPON_COLLECTION)
          .find()
          .toArray();
        // console.log((coupons));
        resolve(coupons);

    });
  },
  addCoupon: (data) => {
    return new Promise(async (resolve, reject) => {
     
      try {
       await db.get().collection(collections.COUPON_COLLECTION).insertOne(data);
      } catch (error) {
        reject();
      }
    });
  },

  deleteCoupon: (proid) => {
    return new Promise(async (resolve, reject) => {

        db.get()
          .collection(collections.COUPON_COLLECTION)
          .deleteOne({ _id: objectId(proid)}).then((response)=>{
            console.log("repo",response);
            resolve(response)
          })

    });
  },
  
  verifyCoupon: (promo,userId) => {
    console.log("uid",userId);
    return new Promise(async (resolve, reject) => {
      try {
    // console.log(coupon);
    let today = new Date().toISOString().slice(0, 10)
    
      let couponoff=await db.get().collection(collection.COUPON_COLLECTION).findOne({coupon:promo})
      console.log("couoff:",couponoff);
      if (couponoff){
        console.log("in couponoff");


        if(couponoff.date_end > today){

          let alreadyCoupon = await db.get().collection(collection.USED_COUPON_COLLECTION).findOne({coupon:couponoff._id,users:objectId(userId)})
          console.log("halo",alreadyCoupon);

          if(!alreadyCoupon){
            

            // alreadyUsed = await db.get().collection(collection.USED_COUPON_COLLECTION).findOne({users:objectId(userId)})
            // if(!alreadyUsed){
    
      
              
                resolve(couponoff)
              }else{
                console.log('jim rsrs ');
                reject()
              }
          
   
        }else{
          console.log("invalid");
          reject()
        }
      }else{
        console.log("used coup il illa");
        reject()
      }
          
    } catch (error) {
        console.log(error);
        reject()
    }
      
    });
    
  },

  usedCoupon:(couponId,userId)=>{
    // 

    let couponObj = {
      coupon:objectId(couponId),
      users:[objectId(userId)]
  }
    // let users={
    //   users: objectId(userId)
    // }
    return new Promise(async(resolve)=>{

      let usedCp= await db.get().collection(collection.USED_COUPON_COLLECTION).findOne({coupon:objectId(couponId)})
      if(usedCp){
        
          // alreadyUsed = await db.get().collection(collection.USED_COUPON_COLLECTION).findOne({users:objectId(userId)})
          // if(!alreadyUsed){
        
        
        let userExist = usedCp.users.findIndex(users=>users==userId)
        if(userExist!=-1){
          console.log("user exist");
          // db.get().collection(collection.USED_COUPON_COLLECTION).updateOne({coupon:objectId(couponId)})
        }else{
          db.get().collection(collection.USED_COUPON_COLLECTION).updateOne({coupon:objectId(couponId)},{
            $push:{users:objectId(userId)}
          
            
          }).then((response)=>{
            resolve()
          })
        }
      }else{
        db.get().collection(collection.USED_COUPON_COLLECTION).insertOne(couponObj).then((response)=>{
          resolve()
        })
      }
    })
  },

  getCouponsForUser:(userId)=>{
    return new Promise(async (resolve, reject) => {

      
      let orderCount =await db.get().collection(collection.ORDER_COLLECTION).countDocuments({userId:objectId(userId)})


      console.log(orderCount);
      // forloop
     if (orderCount> 5){

      let coupons= db.get().collection(collections.COUPON_COLLECTION).find({max_order:{$gt:5}}).toArray().then((response)=>{
        console.log("coup",coupons);

        resolve(coupons)
       })
     }

    })

  },

  // getcouponsUser:(userId)=>{
  //   return new Promise(async(resolve,reject)=>{
      
  //     db.get().collection(collections.COUPON_COLLECTION).find().toArray().then(async(coupon) => {
  //       let orderCount =  db.get().collection(collection.ORDER_COLLECTION).countDocuments({userId:objectId(userId)})          
  //       if(orderCount>coupon)

  //     })
  //   })
  // }
  


};