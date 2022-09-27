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
    
  }

};