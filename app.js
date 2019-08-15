const createError = require('http-errors')
const express			= require('express')
const path			  = require('path')
const cookieParser= require('cookie-parser')
const logger			= require('morgan')
const cors				= require('cors')
const auth				= require('./auth')
const bodyParser	= require('body-parser')

const indexRouter = require('./routes/index')
const user				= require('./api/user')
require('dotenv').config()

const prob = require('./api/prob')
const tag	 =	require('./api/tag')

const app = express()
app.use(cors())				// cross origin request site인데 이거 나중에 wargame1에서만 가능하게끔으로 바꿔야 한다.
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 3000);
app.disable('etag');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);


app

.get('/user/:uid',	auth.ensureAuth('user'), user.get)
.get('/myinfo',			auth.ensureAuth('user'), user.myInfo)
.get('/user',				auth.ensureAuth('user'), user.getAll)
.post('/user/login',  user.login)
.post('/user/join',   user.join)


//.get('/user',				  user.getAll)
/*
.post('/auth/:pid',		challManage.authProb)
*/



.post('/manage/tag/create',  auth.ensureAuth('admin'), tag.createTag)
.put('/manage/tag/update',	 auth.ensureAuth('admin'), tag.updateTag)

.post('/manage/prob/create', auth.ensureAuth('admin'), prob.createProb)
.put('/manage/prob/:pid',	auth.ensureAuth('admin'), prob.updateProb)

.put('/user/:uid',						 auth.ensureAuth('admin'), user.update)

.get('/tags',				auth.ensureAuth('user'), tag.getTags)
.post('/probs',			auth.ensureAuth('user'), prob.getProbs)
.get('/probs/:id',	auth.ensureAuth('user'), prob.getProb)


/*
.get('/manage/prob/:cid',			 challManage.getAllProb)
.post('/manage/prob/:cid',		 challManage.createProb)
.put('/manage/prob/:pid',			 challManage.updateProb)
.get('/manage/prob/:cid/:pid', challManage.getProb)
;*/


// catch 404 and forward to error handler
app.use(function(req, res, next) {
	console.log('error!');
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(app.get('port'), () => {
	console.log(app.get('port'), 'port server')
})

//module.exports = app;

