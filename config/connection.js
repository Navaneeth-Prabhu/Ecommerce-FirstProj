const mongoClient=require('mongodb').MongoClient;

const state = {
    db:null
}

module.exports.connect=function(done) {
    const url='mongodb://localhost:27017';
    const dbname='shopping'

    mongoClient.connect(url, (err, data) => {
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
}
// module.exports.connect=function(done) {
//     const url='mongodb+srv://OctA1N:Mongodb2000@shoping.zrtbfpd.mongodb.net/?retryWrites=true&w=majority';
//     const dbname='shopping'

//     mongoClient.connect(url, (err, data) => {
//         if(err) return done(err)
//         state.db=data.db(dbname)
//         done()
//     })
// }

module.exports.get = function(){
    return state.db;
}