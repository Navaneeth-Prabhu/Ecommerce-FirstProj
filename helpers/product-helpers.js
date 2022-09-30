var db=require('../config/connection')
var collection = require('../config/collections');

var objectId = require('mongodb').ObjectId
var bcrypt = require('bcrypt');
const { response } = require('express');


module.exports={

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
        Totalclick=0;
        product.Totalclick=Totalclick
        if(Number(product.proOff) > 0) {
            product.offerPrice = Number(product.price) - (Number(product.proOff/100) * Number(product.price));
        } else {
            product.offerPrice = 0
        }
    
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            console.log(data);

            callback(data.insertedId)
        })
    },
    

    getAllProducts:() => {
        return new Promise (async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            // .skip((page - 1) * limit)
            // .limit(limit * 1)
            // .sort({ _id: -1 })
            // .exec()
            
            // console.log(product)
            resolve(product)
        })
    },
    deleteProduct:(productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(productId)}).then((response) => {
                // console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails:(productId) => {
        return new Promise((resolve, reject) => {
            
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(productId)}).then((product) => {
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productId)},{$inc:{Totalclick:1}})
                // console.log('this promse');
                product._id = productId
                console.log(product._id)
                resolve (product)
            })
        })
    },

    

    updateProduct:(productId,productDetails)=>{

        if(Number(productDetails.proOff) > 0) {
            productDetails.offerPrice = Number(productDetails.price) - (Number(productDetails.proOff/100) * Number(productDetails.price));
        } else {
            productDetails.offerPrice = 0
        }

        // var today = new Date();
        //     var dd = String(today.getDate()).padStart(2, '0');
        //     var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        //     var yyyy = today.getFullYear();
            
        //     today = mm + '-' + dd + '-' + yyyy;
        //     productDetails.today=today;
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productId)},
                {
            $set:{
                product_title:productDetails.product_title,
                product_description:productDetails.product_description,
                stock:productDetails.stock,
                price:productDetails.price,
                Category:productDetails.Category,
                SubCategory:productDetails.SubCategory,
                proOff:productDetails.proOff,
                offerPrice: productDetails.offerPrice
                // lastEdit:productDetails.today
            }
        


        }).then((response)=>{
            resolve()
        })
        })
    },

    

    trendingPro:()=>{
        return new Promise (async (resolve, reject) => {
            let product=await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({Totalclick:-1}).limit(3).toArray()
            resolve(product)
            console.log("pro:",product);
        })
    },


    // getMensWatch:()=>{
    //      db.get().collection(collection.PRODUCT_COLLECTION).find(Category=='men').then(()=>{

    //     })
    // },

    getMenWatch:() => {
        return new Promise (async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:'Men'}).toArray()
            // console.log(product)
            resolve(product)
        })
    },
    findstat:()=>{
        return new Promise (async(resolve,reject)=>{
            let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{ date:{
                            $gte: new Date(new Date() - 60*60*24*1000*7)
                        }
                    }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        day: { $dayOfMonth: "$date" },
                        dayOfWeek: { $dayOfWeek: "$date" },
                        
                    }
                },
                {
                    $group:{
                        _id:'$dayOfWeek',
                        count:{$sum:1},
                        detail:{$first:'$$ROOT'}
                    }
                },
                {
                    $sort:{detail:1}
                }
        ])
        resolve(data)
        
    })
    },
    finddate:()=>{
        return new Promise(async(resolve,reject)=>{
            let data = await db.get().collection(collection.ORDER_COLLECTION)
        })
    },

    getMostStats:()=>{
        return new Promise(async (resolve, reject) => {
            try {
                let data = await db
              .get()
              .collection(collection.ORDER_COLLECTION)
              .aggregate([
                {
                  $unwind: "$products.products",
                },
                {
                  $project: {
                    item: "$products.products.item",
                  },
                },
                {
                  $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "products",
                  },
                }, 
               
                {
                  $project: {
                    product:"$item",
                    total: { $sum: 1 },
                  },
                },
                {
                    $group:{
                        _id:"$product",
                        count:{$sum:1}
                    }
                }
                
               
              ])
              .toArray();
              console.log("data: ",data)
            resolve(data);
            } catch (error) {
                reject()
            }
            
          });
   },

   proOfferPrice:(proId,productDetails)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).then((pro)=>{
                
            })
        })
    },



    /////////////sorting based on the popularity///////////

    pupularityPro:()=>{
        return new Promise (async (resolve, reject) => {
            let product=await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({Totalclick:-1}).toArray()
            resolve(product)
            // console.log("pro:",product);
        })
    },

    ///////////////////price hight to low/////////////

    hightTolow:()=>{
        return new Promise(async(resolve,reject)=>{
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({offerPrice:-1}).toArray()
            resolve(product)
            
        })
    },

    ////////////////////low to high/////////////////////
    lowToHigh:()=>{
        return new Promise(async(resolve,reject)=>{
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({offerPrice:1}).toArray()
            resolve(product)    
            // console.log("lh",product);
        })
    },

}