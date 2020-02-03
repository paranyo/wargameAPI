const { File,Inventory, Auth, User, Prob, Tag, Sequelize: { Op }, sequelize } = require('../models')
const { hashing } = require('../hashing')

const getProbs = async (req, res) => {
	const { tags } = req.body
	let query = ''
	let value = {}
	try {
		if(req.user) {
			const authority = await User.findOne({ attributes: ['level'], where: { uid: req.user.id } })
				query = "SELECT p.id, p.title, p.description, p.src, p.score, p.createdAt, p.updatedAt, p.deletedAt, p.author, p.tagId, p.fileId, u.nick AS author, t.title AS tag, SUM(a.isCorrect) AS solver FROM probs AS p LEFT JOIN users AS u ON author=uid LEFT JOIN tags AS t ON t.id=p.tagId LEFT JOIN auths AS a ON p.id=a.pid WHERE tagId IN (:tags) GROUP BY p.id"
			if(authority.dataValues.level == 'chore') {
			} else {
				query = "SELECT p.id, p.title, p.description, p.src, p.score, p.createdAt, p.updatedAt, p.deletedAt, p.author, p.tagId, p.fileId, u.nick AS author, t.title AS tag, SUM(a.isCorrect) AS solver FROM probs AS p LEFT JOIN users AS u ON author=uid LEFT JOIN tags AS t ON t.id=p.tagId LEFT JOIN auths AS a ON p.id=a.pid WHERE tagId IN (:tags) AND p.deletedAt IS NULL GROUP BY p.id"
			}
			if(tags.length <= 0)
				tags.push(0)
			value = { tags }
			const prob2 = await sequelize.query(query, { replacements: value }).spread((result, meta) => {
				return result.map(a => a)
			}, (err) => { console.error(err) })
			query = "SELECT pid, isCorrect FROM auths WHERE solver=:uid AND isCorrect=1"
			value = { uid: req.user.id }
			const auth2 = await sequelize.query(query, { replacements: value }).spread((result, meta) => {
				return result.map(a => a)
			}, (err) => { console.error(err) })

			auth2.map(a => {
				prob2.map(p => {
					if(a.pid == p.id)	{
						return p.isCorrect = true
					}
				})
			})
			return res.status(201).json({ list: prob2 })
		}
	} catch (e) {
		console.dir(e)
		return res.status(403).json({ error: '실패' })
	}
}

const getProb = async(req, res, next) => {
	try {
		const { id } = req.params
		const authority = await User.findOne({ attributes: ['level'], where: { uid: req.user.id } })
		let prob
		if(authority.dataValues.level == 'chore') {
			prob = await Prob.findOne({ where: { id }, paranoid: false })
		} else {
			prob = await Prob.findOne({ where: { id } })
		}
		if(!prob) return res.status(404).json({ message: 'Not Found Prob' })

		if(prob.dataValues.fileId) {
			if(authority.dataValues.level == 'chore')
				prob = await File.findOne({ where: { id: prob.dataValues.fileId }, paranoid: false, include: [{ model: Prob, required: true, where: { id }, paranoid: false }] })
			else
				prob = await File.findOne({ where: { id: prob.dataValues.fileId }, attributes: ['saveName', 'size'], 
							include: [{ model: Prob, required: true, where: { id }, attributes: ['id', 'title', 'description', 'score', 'author', 'src', 'createdAt', 'updatedAt', 'tagId', 'fileId' ] }] })
			prob.dataValues.file = {}
			prob.dataValues.file.id					= prob.dataValues.id
			prob.dataValues.file.originName	= prob.dataValues.originName
			prob.dataValues.file.saveName		= prob.dataValues.saveName
			prob.dataValues.file.createdAt	= prob.dataValues.createdAt
			prob.dataValues.file.uploader	  = prob.dataValues.uploader
			prob.dataValues.file.size				= prob.dataValues.size
			prob.dataValues.file.deletedAt	= prob.dataValues.deletedAt
			prob.dataValues.id = prob.dataValues.probs[0].id
			prob.dataValues.title = prob.dataValues.probs[0].title
			prob.dataValues.description = prob.dataValues.probs[0].description
			prob.dataValues.score	 = prob.dataValues.probs[0].score
			prob.dataValues.author = prob.dataValues.probs[0].author
			prob.dataValues.src = prob.dataValues.probs[0].src
			prob.dataValues.createdAt = prob.dataValues.probs[0].createdAt
			prob.dataValues.updatedAt = prob.dataValues.probs[0].updatedAt
			prob.dataValues.tagId = prob.dataValues.probs[0].tagId
			prob.dataValues.fileId = prob.dataValues.probs[0].fileId
			if(authority.dataValues.level == 'chore')
				prob.dataValues.flag = prob.dataValues.probs[0].flag
			delete prob.dataValues.probs
			/* zz 나중에 수정 zzz */
		}
		return res.status(201).json({ prob })
	} catch (e) {
		next(e)
	}
}


const createProb = async (req, res, next) => {
	const { title, description, flag, author, score, tagId, isOpen, fileId, src } = req.body // tags는 객체 형태로 옴 
	try {
		// 문제 생성
		let deletedAt = null
		if(isOpen == false)
			deletedAt = new Date()
		if(!title||!flag||!author||!score||!tagId)
			return res.status(400).json({ message: '제목, 플래그, 출제자, 점수, 태그는 필수입니다' })
		const prob = await Prob.create({ title, description, flag: hashing(flag), author, tagId, score, deletedAt, fileId, src }) 
	} catch (e) {
		console.dir(e)
		next(e)
	}
	return res.status(201).json({ result : 'true' })
}

const updateProb = async (req, res, next) => {
	const id = req.params.id
	const { title, description, flag, author, score, tagId, isOpen, fileId, src } = req.body
	// author는 외래 키이므로 디비에 어드민으로 존재하지 않는 경우 예외 처리 해야함
	try {
		if(isOpen == true)	// 문제를 열 경우 deleteAt = null
			Prob.restore({ where: { id } })
		const prob = await Prob.findOne({ where: { id }, paranoid: false })
		if(!prob) return res.status(404).json({ error : '존재하지 않는 문제 ' })
		if(title)
			Prob.update({ title, description, flag, author, score, tagId, fileId, src }, { where: { id }, paranoid: false })	
			// 문제 업데이트
		if(isOpen == false) // 문제를 닫을 경우 수정 후 닫기 위해 destroy 나중에 함
			Prob.destroy({ where: { id } })

		return res.status(201).json({ result: '성공' })
	} catch(e) {
		console.error(e)
		next(e)
	}
}

const visibleProb = async (req, res, next) => {
	const { id, isOpen } = req.body
	try {
		if(isOpen == true) {
			Prob.restore({ where: { id } })
		} else if(isOpen == false) {
			Prob.destroy({ where: { id } })
		}
		return res.status(201).json({ result: '성공' })
	} catch (error) {
		console.error(e)
		next(e)
	}
}
const authProb = async(req, res) => {
	const { id } = req.params
	const scores = await Auth.findAll({ 
		where: { solver: req.user.id, isCorrect: 1 },
		include: [
			{ model: Prob, required: true, attributes: ['score'] }
		],
	})
	let sum = 0
	scores.map((sc) => {
		sum += parseInt(sc.dataValues.prob.dataValues.score)
	})
	if(req.body.flag) {
		try {
			let flag = hashing(req.body.flag)
			const prob = await Prob.findOne({ where: { id } })
			if(prob) {
				const already = await Auth.findOne({ where: { solver: req.user.id, pid: id, isCorrect: 1 } })
				if(already) {
					if(prob.dataValues.flag === flag)
						return res.status(201).json({ result: '정답입니다. (이미 푼 문제)' })
					else 
						return res.status(201).json({ result: '오답입니다. (이미 푼 문제)' })
				}
				if(prob.dataValues.flag === flag) {
					await Auth.create({ pid: id, solver: req.user.id, isCorrect: true, flag: req.body.rFlag })
					/* 랜덤 아이템 */
					let lottery		= (Math.random() * 100).toFixed(1)
					let randomBox	= 0

					/* 나중에 아이템 수정하깅 */ 
					if(lottery > 0 && lottery < 75)					randomBox	=	4000703
					else if(lottery > 75 && lottery < 90)		randomBox	= 1162000
					else if(lottery > 90 && lottery < 95)		randomBox	= 4031008
					else if(lottery > 95 && lottery < 98)		randomBox	= 1322008
					else if(lottery > 98 && lottery < 99.5)	randomBox	= 2028048
					else if(lottery > 99.5)									randomBox	= 5830001
					
					await Inventory.create({ 
						itemCode: randomBox, cCode: 99, userId: req.user.id	
					})
					
					return res.status(201).json({ result: '정답입니다!' })
				} else {
					await Auth.create({ pid: id, solver: req.user.id, isCorrect: false, flag: req.body.rFlag })
					return res.status(201).json({ result: '오답입니다.' })
				}
			} else { // 문제가 없을 경우
				return res.status(404).json({ message: '문제가 닫혀있거나 찾을 수 없습니다' })
			}
		} catch(error) {
			console.error(error)
			next(error)
		}
	} else {
		return res.status(401).json({ result: '비허가 접근입니다' })
	}
}
module.exports = {
	getProbs,
	getProb,
	createProb,
	updateProb,
	authProb,
	visibleProb,
}
