var db=require('../config/connection')
var collection = require('../config/collections');

var objectId = require('mongodb').ObjectId

const { response } = require('express');


module.exports ={

        addBanner:(banner, callback) => {
            // var curruntDate = new Date();
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();
            
            today = mm + '-' + dd + '-' + yyyy;
            banner.Date=today

    
        db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((data) => {
            console.log(data);

            callback(data.insertedId)
        })
    },


        getAllBanner:() => {
            return new Promise (async (resolve, reject) => {
                let banner = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()

                resolve(banner)
            })
        },

        getBanner:(bannerId) => {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.BANNER_COLLECTION).findOne({_id:objectId(bannerId)}).then((banner) => {
                    resolve (banner)
                })
            })
        },

        updateBanner:(bannerId,Details)=>{         
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.BANNER_COLLECTION).updateOne({_id:objectId(bannerId)},
                    {
                $set:{
                   
                    banner_name:Details.banner_name
                  
                }
    
            }).then((response)=>{
                resolve()
            })
            })
        },
        deleteBanner:(bannerId) => {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.BANNER_COLLECTION).deleteOne({_id:objectId(bannerId)}).then((response) => {
                    // console.log(response);
                    resolve(response)
                })
            })
        },
}