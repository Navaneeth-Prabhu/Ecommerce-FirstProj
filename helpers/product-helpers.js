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
    
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            console.log(data);

            callback(data.insertedId)
        })
    },

    getAllProducts:() => {
        return new Promise (async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
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
                resolve (product)
            })
        })
    },

    

    updateProduct:(productId,productDetails)=>{

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
                SubCategory:productDetails.SubCategory
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

    }