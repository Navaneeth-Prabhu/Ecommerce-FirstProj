var db=require('../config/connection')
var collection = require('../config/collections');

var objectId = require('mongodb').ObjectId

const { response } = require('express');
const { ReservationList } = require('twilio/lib/rest/taskrouter/v1/workspace/task/reservation');
const { verify } = require('jsonwebtoken');

module.exports ={
    

    addtoWallet:(details,userId)=>{

        details.userId = userId
        return new Promise(async(resolve,reject)=>{
        walletExist = await db.get().collection(collection.WALLET_COLLECTION).findOne({userId:userId})
        if(walletExist){
            let ctotal = await db.get().collection(collection.WALLET_COLLECTION).findOne({userId: userId}, {wall_amount:1, _id: 0})
            console.log(ctotal);
            let currenttotal = Number(ctotal.wall_amount)
            let ntotal = Number(details.wall_amount)+ currenttotal;
            if(ntotal > 0){
                db.get().collection(collection.WALLET_COLLECTION).updateOne({userId:userId},{
                $set: {
                    wall_amount: ntotal
                }
            }).then(() => {
                resolve(true)
            })
            } else {
                db.get().collection(collection.WALLET_COLLECTION).updateOne({userId:userId},{
                    $set: {
                        wall_amount: 0
                    }
                }).then(() => {
                    resolve(0)
                })
            }
            
        } else{
            details.userId= objectId(details.userId)
             db.get().collection(collection.WALLET_COLLECTION).insertOne(details).then((response)=>{
               resolve(response)
           })
        }
          
           
       })
    },

    getWallet: function (userId) {
        return new Promise( async function(resolve, reject) {
            db.get().collection(collection.WALLET_COLLECTION).findOne({userId: objectId(userId)}).then((wallet) => {
                resolve(wallet)
            })
        })
    }


}