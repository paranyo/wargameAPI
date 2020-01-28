const createError = require('http-errors')
const express			= require('express')
const path			  = require('path')
const cookieParser= require('cookie-parser')
const logger			= require('morgan')
const cors				= require('cors')
const auth				= require('./auth')
const bodyParser	= require('body-parser')

const { hashing } = require('./hashing')
const multer			= require('multer')

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public/files/')	
	},
	filename: (req, file, cb) => {
		cb(null, hashing(file.originalname + new Date()) + path.extname(file.originalname))
	}
})

const upload = multer({ storage: storage });

require('dotenv').config()

const sequelize = require('./models').sequelize;

const user	 = require('./api/user')
const prob	 = require('./api/prob')
const tag		 =	require('./api/tag')
const admin	 = require('./api/admin')
const log		 = require('./api/log')
const item	 = require('./api/item')
const notice = require('./api/notice')
const shop	 = require('./api/shop')
const auction = require('./api/auction')
const settings = require('./api/settings')

const saveError = require('./saveError')

const webSocket = require('./socket')
const checkBid	= require('./checkBid')

const app = express()
sequelize.sync()

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

app
.use(log.logging())


.post('/user/login',  user.login)
.post('/user/join',   user.join)
.post('/user/sendMail',   user.sendMail)
.use(settings.checkTime())
/* 유저 정보 열람 */
.get('/user/:uid',	auth.ensureAuth('user'), user.get)
.get('/myinfo',			auth.ensureAuth('user'), user.get)
.get('/myCorrect',	auth.ensureAuth('user'), user.getCorrect)
.get('/user',				auth.ensureAuth('user'), user.getRanking)

/* 로그인, 가입, 비밀번호 분실 관련 */


/* 공지사항 관련 */
.get('/notice', notice.get)
.post('/notice/create', auth.ensureAuth('admin'), notice.create)
.put('/notice/update',	auth.ensureAuth('admin'), notice.update)

/* 대회 문제 분야 */
.get('/tags',				auth.ensureAuth('user'), tag.getTags)
.post('/manage/tag/create',  auth.ensureAuth('admin'), tag.createTag)
.put('/manage/tag/update',	 auth.ensureAuth('admin'), tag.updateTag)

/* 문제 관련 */
.post('/manage/prob/create', auth.ensureAuth('admin'), prob.createProb)
.put('/manage/prob/visible', auth.ensureAuth('admin'), prob.visibleProb)
.put('/manage/prob/:id',		 auth.ensureAuth('admin'), prob.updateProb)
.post('/probs',			auth.ensureAuth('user'), prob.getProbs)
.get('/probs/:id',	auth.ensureAuth('user'), prob.getProb)
.post('/auth/:id',	auth.ensureAuth('user'), prob.authProb)

/* 해싱, 로그, 유저 수정 */
.post('/manage/hash',		auth.ensureAuth('admin'), admin.getHash)
.post('/manage/log',		auth.ensureAuth('admin'), admin.getLog)
.put('/user/:uid',			auth.ensureAuth('admin'), user.update)
.put('/user',						auth.ensureAuth('user'), user.updateSelf)
.get('/manage/user',		auth.ensureAuth('admin'), user.getUsers)

/* 파일 관련 */
.post('/manage/file/upload', auth.ensureAuth('admin'), upload.single('file'), admin.uploadFile)
.put('/manage/file/remove', auth.ensureAuth('admin'), admin.removeFile)
.get('/manage/file', auth.ensureAuth('admin'), admin.getFile)
.get('/download/:fName', /*auth.ensureAuth('user'),*/ user.downloadFile) // 다운로드 권한 추가하기

/* 아이템 관련 */
.get('/item',				auth.ensureAuth('user'), item.getItems)
.post('/item/equip/:uid', auth.ensureAuth('user'), item.equipItem)
.get('/item/clearEquip', auth.ensureAuth('user'), item.clearEquip)
.post('/item/box',				auth.ensureAuth('user'), item.useBox)

/* 상점 관련 */
.get('/shop/:id', auth.ensureAuth('user'), shop.getProduct)
.get('/shop',	auth.ensureAuth('user'), shop.get)
.get('/manage/shop', auth.ensureAuth('admin'), shop.getItems)
.post('/manage/shop/create', auth.ensureAuth('admin'), shop.create)
.post('/manage/shop/update/:id', auth.ensureAuth('admin'), shop.update)
.put('/manage/shop/remove/:id', auth.ensureAuth('admin'), shop.remove)
.get('/shop/buy/:pId', auth.ensureAuth('user'), shop.buy)

.get('/setting', admin.getSetting)
.post('/manage/setting/create', auth.ensureAuth('admin'), admin.setSetting)
.post('/manage/setting/update', auth.ensureAuth('admin'), admin.updateSetting)


/* 경매장 */
.get('/auction', auth.ensureAuth('user'), auction.get)
.post('/auction/create', auth.ensureAuth('user'), auction.create)
.post('/auction/bid', auth.ensureAuth('user'), auction.bidding)


/* 404 에러 처리 */
/*app.use((req, res, next) => {
	console.log('\n\nERROR\n\n')
  next(createError(404))
})*/


/* 에러 핸들러 */

app.use((err, req, res, next) => {
	res.locals.message = err.message
	res.locals.error = req.app.get('env') === 'development' ? err : {}
	console.error(err)
	if(err.original.sql)
		saveError(err)
	switch(err.original.code) {
		case 'ER_NO_REFERENCED_ROW_2':
			return res.status(400).json({ message: err.fields + ' 필드의 값을 확인하세요' })
		case 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD':
			return res.status(400).json({ message: '부적절한 자료형을 확인하세요.' })
		default:
			return res.status(400).json({ message: 'error' })
	} 
})

const server = app.listen(app.get('port'), () => {
	console.log(app.get('port'), 'port server')
})

webSocket(server, app)
checkBid(app)
