var db=require('../config/connection')
var collection = require('../config/collections');

var objectId = require('mongodb').ObjectId
var bcrypt = require('bcrypt');
const { response } = require('express');
const collections = require('../config/collections');


module.exports ={
    
        addCategory:(category, callback) => {
            // var curruntDate = new Date();
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();
              
            today = mm + '-' + dd + '-' + yyyy;
            category.Date=today

        
        db.get().collection(collection.CATEGORY_COLLECTION,offer).insertOne(category).then((data) => {
            console.log(data);

            callback(data)
        })
    },    


    addCategories:(data)=>{
        return new Promise(async(resolve,reject)=>{
            try {
        db.get().collection(collections.CATEGORY_COLLECTION).insertOne(data)
                
            } catch (error) {
                reject()
            }
    })
},


    addProduct:(product, callback) => {
        // var curruntDate = new Date();
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        
        today = mm + '-' + dd + '-' + yyyy;
        product.Date=today
        // product.lastEdit=null
    // console.log(product);

    db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
        console.log(data);

        callback(data.insertedId)
    })
},

        getAllCategory:() => {
            // getOffers()
            return new Promise (async (resolve, reject) => {
                let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
                console.log(categories)
                resolve(categories)
            })
        },

        getCategory:(catId) => {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(catId)}).then((category) => {
                    resolve (category)
                })
            })
        },
        updateCategory:(catId,Details)=>{

           
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(catId)},
                    {
                $set:{
                   
                    Category_name:Details.Category_name
                    // lastEdit:productDetails.today
                }
            
    
    
            }).then((response)=>{
                resolve()
            })
            })
        },
        deleteCategory:(catId) => {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(catId)}).then((response) => {
                    // console.log(response);
                    resolve(response)
                })
            })
        },
        addCategoryOff:(catId,offer,validTill, validFrom)=>{
 
            return new Promise(async(resolve,reject)=>{
                
                // try {
                    let offerPrice = []
                let off=Number(offer)
                let offTill = validTill
                console.log(catId);
                let offFrom = validFrom
                let date = new Date()
                // let currentDate = moment(date).format('YYYY-MM-DD')
                let ppa = {category:catId} 
                // if (catId.validTill < currentDate) {
                //     db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(catId) },
                //         {
                //             $unset: {
                //                 "offer": categories[i].offer,
                                
                //             }
                //         })
                //         products.forEach(data=>{
                //             db.get().collection(collection.PRODUCT_COLLECTION).updateMany({category:catId},
                //                 {
                //                     $unset: {
                //                         "offerPrice" :data.offerPrice,
                //                     }
                //                 })
                //         })
                       
                // }else{
                

                    await db.get().collection(collection.PRODUCT_COLLECTION).find({SubCategory: catId,}).toArray().then((res)=>{
                        res.forEach(data=>{
                         
                            let price = Number(data.price)
                            offerPrice.push({offerPrice:parseInt(price-(price*(off/100))),proId:data._id})
                        })
                       offerPrice.forEach(data=>{
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:data.proId},{$set:{offerPrice:data.offerPrice}})
                       })
                       console.log("cat"+ catId);
                       db.get().collection(collection.CATEGORY_COLLECTION).updateOne({Category_name:catId},{$set:{offer:off,validTill:offTill, validFrom: offFrom}},{upsert: true}).then((res)=>{
                        
                       })
                    })
                // }
              resolve()
                // } catch (error) {
                //     reject()
                // } 
            })    
       },
       deleteCategoryOffer:(catId) => {
        return new Promise((resolve, reject) => {
            console.log(catId);
            // await db.get().collection(collection.PRODUCT_COLLECTION).find({SubCategory: catId}).toArray().then((res)=>{
               db.get().collection(collection.CATEGORY_COLLECTION).updateOne({Category_name: catId}, {$unset:{offer:"", validFrom:"", validTill:""}}).then((response) => {
                console.log((response));
                db.get().collection(collection.PRODUCT_COLLECTION).updateMany({SubCategory: catId}, {$unset:{offerPrice:""}}).then((res) => {
                    resolve(res)
                })
               })
                
        // })
        })
    },

    getOffers(){
        return new Promise((resolve, reject) => {
            try {
                let date = new Date()
                let currentDate = moment(date).format('YYYY-MM-DD')
                db.get().collection(collections.CATEGORY_COLLECTION).find().toArray().then(async(categories) => {
                
                    for (let i in categories) {
                        let catId = categories[i]._id.toString()
                        let products = await db.get().collection(collections.PRODUCT_COLLECTION).find({category:catId}).toArray()
                        console.log(products);
                        if (categories[i].offer) {
                            if (categories[i].validTill < currentDate) {
                                db.get().collection(collections.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(categories[i]._id) },
                                    {
                                        $unset: {
                                            "offer": categories[i].offer,
                                            
                                        }
                                    })
                                    products.forEach(data=>{
                                        db.get().collection(collections.PRODUCT_COLLECTION).updateMany({category:catId},
                                            {
                                                $unset: {
                                                    "offerPrice" :data.offerPrice,
                                                }
                                            })
                                    })
                                   
                            }
                        }
                    }
                })
            } catch (error) {
                reject()
            }
           
            // db.get().collection(collections.CATEGORY_COLLECTION).find().toArray().then((category) => {
            //     resolve(category)
            // })
        })
    
    }
       
}