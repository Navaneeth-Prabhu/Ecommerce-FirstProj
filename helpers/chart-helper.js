var db=require('../config/connection')
var collection = require('../config/collections');

var objectId = require('mongodb').ObjectId

const { response } = require('express');


module.exports ={
    findOrdersByDay:()=>{
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
        ]).toArray()
            // console.log(data);
            
            resolve(data)
        })
    },
    findOrderByMonth:()=>{
        return new Promise (async(resolve,reject)=>{
            let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        date:{
                            $gte:new Date(new Date().getMonth() - 10)
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
                        week: { $week: "$date" }
                    }
                },
                {
                    $group:{
                        _id:'$month',
                        count:{$sum:1},
                        detail:{$first:'$$ROOT'}
                    }
                },
                {
                    $sort:{detail:-1}
                }
            ]).toArray()
            // console.log(data);
            resolve(data)
        })
    },
    findOrderByYear:()=>{
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(new Date().getYear() - 10)
                        }
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        day: { $dayOfMonth: "$date" },
                        dayOfWeek: { $dayOfWeek: "$date" },
                        week: { $week: "$date" }
                    }
                },
                {
                    $group: {
                        _id: '$year',
                        count: { $sum: 1 },
                        detail: { $first: '$$ROOT' }
                    }
                },
                {
                    $sort: { detail: -1 }
                }
            ])
            console.log("chart:",data);
            resolve(data)
        })
    },

    categoryStatus:()=>{
        return new Promise(async(resolve,reject)=>{
            let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{ date:{
                        $gte: new Date(new Date().getMonth()-10)
                        }
                    }
                },
                {
                  $lookup:  {
                    from:'product',
                    localField:'products.item',
                    foreignField:'_id',
                    as:'pro'
                  },

                },
                {
                    $unwind:'$pro'            
                },
                {
                    $project:{
                        cat:"$pro.SubCategory"
                    }
                },
                {
                    $group:{
                        _id:"$cat",
                        count:{$sum:1},
                        detail:{$first:"$$ROOT"}
                    }
                },
                // {

                // }


            ]).toArray()
            resolve(data)
            // console.log(data.detail.cat);
        })
    }
}