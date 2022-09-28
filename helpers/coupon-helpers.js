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
        console.log((coupons));
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
      try {
        db.get()
          .collection(collections.COUPON_COLLECTION)
          .removeOne({ _id: objectId(proid) });
      } catch (error) {
        reject();
      }
    });
  },
  
  verifyCoupon: (coupon) => {
    return new Promise(async (resolve, reject) => {
      try {
    
      db.get().collection(collection.COUPON_COLLECTION).findOne({
        coupon: coupon.coupon
      }).then((res) => {
        
        console.log(res);
        resolve(res)
      })
          
    } catch (error) {
        console.log(error);
        reject()
    }
      
    });
    
  },

  usedCoupon:(userId,couponId)=>{
    let userObj={
      user: objectId(userId)
    }
    return new Promise(async(resolve)=>{

      let usedCp= await db.get().collection(collection.USED_COUPON_COLLECTION).findOne({coupon:objectId(couponId)})
      if(usedCp){
        
        let userExist = usedCp.user.findIndex(user=>user==userId)
        if(userExist!=-1){

          // db.get().collection(collection.USED_COUPON_COLLECTION).updateOne({coupon:objectId(couponId)})
        }else{
          db.get().collection(collection.USED_COUPON_COLLECTION).updateOne({coupon:objectId(couponId)},{
            $push:{user:userObj}
          }).then((response)=>{
            resolve()
          })
        }
      }else{
        db.get().collection(collection.USED_COUPON_COLLECTION).insertOne(userObj).then((response)=>{
          resolve()
        })
      }
    })
  }

};