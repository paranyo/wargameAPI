const { File,Inventory, Auth, User, Prob, Tag, Sequelize: { Op } } = require('../models')


const getProbs = async (req, res) => {
	const { tags } = req.body
	try {
		if(req.user) {
			const authority = await User.find({ attributes: ['level'], where: { uid: req.user.id } })

			let tagList = tags ? { where: { tagId: { [Op.in]: tags } } } : {}
		
			if(authority.dataValues.level == 'chore') {
				list2 = await Tag.findAll({ tagList, where: { id: { [Op.in]: tags } },
					include: [{ model: Prob, required: true, paranoid: false }]
				})
			} else { // 나중에 플래그 같은 값은 없애고 보내야함
				list2 = await Tag.findAll({ tagList, where: { id: { [Op.in]: tags } }, 
					include: [
						{ model: Prob, required: true, 
							include: [
							{	model: Auth, required: true, attributes: ['isCorrect'] },
							{ where : { solver: req.user.id } }
						]}
					]
				})
			}
			/* isCorrect 구하기 */
			const authList = await Auth.findAll({ solver: req.user.id, 
					attributes: ['isCorrect', 'solver', 'pid'] })
			/* Solver  구하기 */
			for(let i = 0; i < list2.length; i++) {
				for(let j = 0; j < list2[i].dataValues.probs.length; j++) {
					list2[i].dataValues.probs[j].dataValues.tag = list2[i].dataValues.title
					let pid = list2[i].dataValues.probs[j].dataValues.id
					const solvers = await Auth.findAll({
						where: { pid, isCorrect: 1 },
						include: [{ model: Prob, required: true, }]
					})
					list2[i].dataValues.probs[j].dataValues.solver = solvers.length
					/* isCorrect 구하기 */
					for(let k = 0; k < authList.length; k++) {
						if(authList[k].dataValues.pid == list2[i].dataValues.probs[j].dataValues.id) {
							list2[i].dataValues.probs[j].dataValues.isCorrect = authList[k].dataValues.isCorrect
							authList.splice(k, 1)
						}
					}
				}
			}
			let list = []
			list2.forEach((tag) => { tag.dataValues.probs.forEach(a => { list.push(a) })	})


			return res.status(201).json({ list })
		}
	} catch (e) {
		console.error(e)
		return res.status(403).json({ error: '실패' })
	}
}

const getProb = async(req, res, next) => {
	const { id } = req.params
	const authority = await User.find({ attributes: ['level'], where: { uid: req.user.id } })
	if(!id) return res.status(404).json({ error : '문제를 찾을 수 없음' })
	let prob = await Prob.findOne({ where: { id }, paranoid: false })
	if(!prob) return res.status(404).json({ error: '문제를 찾을 수 없음' })
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
		prob.dataValues.file.size				= prob.dataValues.size
		prob.dataValues.file.createdAt	= prob.dataValues.createdAt
		prob.dataValues.file.updatedAt	= prob.dataValues.updatedAt
		prob.dataValues.file.deletedAt	= prob.dataValues.deletedAt
		prob.dataValues.file.uploader	  = prob.dataValues.uploader
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
		delete prob.dataValues.probs
		/* zz 나중에 수정 zzz */
	}
	return res.status(201).json({ prob })
}


const createProb = async (req, res, next) => {
	const { title, description, flag, author, score, tagId, isOpen, fileId, src } = req.body // tags는 객체 형태로 옴

	try {
		// 문제 생성
		let deletedAt = null
		if(isOpen == false)
			deletedAt = new Date()
		const prob = await Prob.create({
			title, description, flag, author, tagId, score, deletedAt, fileId, src
		}) 
	} catch (e) {
		console.error(e)
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
	
	console.log(req.body)
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
			const prob = await Prob.findOne({ where: { id } })
			if(prob) {
				const already = await Auth.findOne({ where: { solver: req.user.id, pid: id, isCorrect: 1 } })
				if(already) {
					if(prob.dataValues.flag === req.body.flag)
						return res.status(201).json({ result: 'Already Solved, But Correct!' })
					else 
						return res.status(201).json({ result: 'Already Solved and Incorrect!' })
				}
				if(prob.dataValues.flag === req.body.flag) {
					await Auth.create({ pid: id, solver: req.user.id, isCorrect: true, flag: req.body.rFlag })
					/* 랜덤 아이템 */
					let lottery		= (Math.random() * 100).toFixed(1)
					let randomBox	= 0

					/* 나중에 아이템 수정하깅 */ 
					if(lottery > 0 && lottery < 84)					randomBox	=	4000703
					else if(lottery > 84 && lottery < 89)		randomBox	= 1162000
					else if(lottery > 89 && lottery < 99)		randomBox	= 1162000
					else if(lottery > 99 && lottery < 99.5)	randomBox	= 1162000
					else if(lottery > 84 && lottery < 99.9)	randomBox	= 1162000
					else if(lottery == 99.9)								randomBox	= 1162000
					
					await Inventory.create({ 
						itemCode: randomBox, cCode: 99, userId: req.user.id	
					})
					
					return res.status(201).json({ result: 'Correct!' })
				} else {
					await Auth.create({ pid: id, solver: req.user.id, isCorrect: false, flag: req.body.rFlag })
					return res.status(201).json({ result: 'Incorrect' })
				}
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
