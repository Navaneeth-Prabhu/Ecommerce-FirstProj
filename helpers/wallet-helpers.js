var db=require('../config/connection')
var collection = require('../config/collections');

var objectId = require('mongodb').ObjectId

const { response } = require('express');
const { ReservationList } = require('twilio/lib/rest/taskrouter/v1/workspace/task/reservation');
const { verify } = require('jsonwebtoken');

module.exports ={
    

    // addtoWallet:(price,userId)=>{

    //     // details.userId = userId
    //     return new Promise(async(resolve,reject)=>{
    //         // let wallet=0
    //         let ctotal=await db.get().collection(collection.USER_COLLECTION).findOne({_id:userId})
    //         console.log("ctotal:",ctotal.wallet);
    //         console.log(ctotal);
    //         let currenttotal=Number(ctotal.wallet)
    //         console.log(currenttotal);
    //         console.log(price);
    //         let ntotal = Number(price.wall_amount)+currenttotal
    //         await db.get().collection(collection.USER_COLLECTION).updateOne({_id:userId},
    //             {$set:{
    //                 wallet:ntotal
    //                  }
    //             }).then(()=>{
    //                 resolve(true)
    //             })
            
          
           
    //    })
    // },

    addtoWallet:(details,userId)=>{

        details.userId = userId
        return new Promise(async(resolve,reject)=>{
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();
        
            today = mm + '-' + dd + '-' + yyyy;
            date=today
            walletobj = {
                transactionamount: details.wall_amount,
                isDebit:false,
                date:date,
                message:'credited due to cancelling the product'
            }
        walletExist = await db.get().collection(collection.WALLET_COLLECTION).findOne({userId:userId})
        if(walletExist){
            let ctotal = await db.get().collection(collection.WALLET_COLLECTION).findOne({userId: userId}, {wall_amount:1, _id: 0})
            
            db.get()
              .collection(collection.WALLET_COLLECTION)
              .updateOne(
                { userId: userId },
                {
                  $push: { walletobj },
                }
              ).then(()=>{

             

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
        })
            
        } else{
            details.userId= objectId(details.userId)
             db.get().collection(collection.WALLET_COLLECTION).insertOne(details.userId).then((response)=>{
                db.get()
                .collection(collection.WALLET_COLLECTION)
                .updateOne(
                  { userId: userId },
                  {
                    $push: { walletobj },
                  }
                ).then(()=>{
               resolve(response)
                })
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
    },


    getWalletTrans:(userId)=>{
        console.log(userId);
        return new Promise(async(resolve,reject)=>{
            let walletTrans=await db.get().collection(collection.WALLET_COLLECTION).aggregate([
                 {
                    $match:{userId:objectId(userId)}
                 },
                 {
                    $unwind:'$walletobj'
                 },
                 {
                    $project:{
                        transactionamount:'$walletobj.transactionamount',
                        isDebit:'$walletobj.isDebit',
                        date:'$walletobj.date',
                        message:'$walletobj.message',
                        

                    }
                 },
  
                 {
                    $project:{
                        transactionamount:1,
                        isDebit:1,
                        date:1,
                        message:1
                    }
                 }

            ]).sort({"date":-1}).toArray()
            console.log("walletTrn",walletTrans);
            resolve(walletTrans)
        })
    },
}