var db=require('../config/connection')
var collection = require('../config/collections');

var objectId = require('mongodb').ObjectId
var bcrypt = require('bcrypt');
const { response } = require('express');


module.exports ={
        // addCategory:function(category) {
        //     return new Promise(async function (resolve, reject) {
        //         var isThere = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ Category_name: category.Category_name })
        //         if (isThere) {
        //             resolve(false)
        //         } else {
                  
        //             db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data) => {
        //                 // console.log(data);
        //                 resolve(data)
        //             })
        //         }
        //     })    
        // },
        addCategory:(category, callback) => {
            // var curruntDate = new Date();
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();
            
            today = mm + '-' + dd + '-' + yyyy;
            category.Date=today

    
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data) => {
            console.log(data);

            callback(data)
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
}