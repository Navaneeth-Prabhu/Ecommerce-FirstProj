var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var hbs = require('express-handlebars');
const Handlebars = require('handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')
var app = express();

///fileUpload////////
var fileUpload=require('express-fileupload')
var db=require('./config/connection')
var session=require('express-session')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// app.engine('hbs', hbs.engine({extname:'hbs', defaultLayout:'layout', layoutsDir:__dirname+'/views/layout/', partialsDir:__dirname+'/views/partials/',handlebars: allowInsecurePrototypeAccess(Handlebars)}))


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(session({secret:"Key", cookie:{maxAge:600000}}))

db.connect(function(err) {
  if(err) console.log('error'+err);
  else console.log("database connected");
})

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

const exhbs= hbs.create({
  extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/',


  helpers:{
    iff:function (a,b,options){
      
     
      a=a.toString();
      b=b.toString();
      
      if ( a === b ){
       
        return "<h2>"+ options.fn({status:true}) +"</h2>"
      }else{
        
        
      }
    },
    off:function (a,b,options){
     
    
      
     
       
        return parseInt(a-(a*(b/100)))
  
    },
    stringCompaire:function (left,opertor,right){
     if(opertor == '<'){
      console.log("----------",left,opertor,right);
       if(left < right)
       {
         return true
       }else{
         return false
       }
     }
     
   }
  },


})


app.engine('hbs',exhbs.engine)

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



// app.get('/error',(req,res)=>{
//   if (req.session.admin) {
//     res.render('error',{admin:true});
//   }
//   else{
//     res.render('error');
//   }
// })


module.exports = app;
