const { Auth, User, Prob, Tag, Sequelize: { Op } } = require('../models')


const getProbs = async (req, res) => {
	const tags = req.body.tags
	try {
		if(req.user) {
			const authority = await User.find({ attributes: ['level'], where: { uid: req.user.id } })
			if(authority.dataValues.level == 'chore') {
				if(tags) {
					const list = await Prob.findAll({ 
						where: { tag: { [Op.in]: tags } },
						paranoid: false,
					})
					return res.status(201).json({ list })
				} else {
					const list = await Prob.findAll({ paranoid: false })
					return res.status(201).json({ list })
				}
			} else {
				if(tags) {
					const list = await Prob.findAll({	where: { tag: { [Op.in]: tags } }	})
					return res.status(201).json({ list })
				} else {
					const list = await Prob.findAll()
					return res.status(201).json({ list })
				}
			}
		}
	} catch (e) {
		console.error(e)
		return res.status(403).json({ error: '실패' })
	}
}

const getProb = async(req, res, next) => {
	const { id } = req.params
	if(!id) return res.status(404).json({ error : '문제를 찾을 수 없음' })
	const prob = await Prob.findOne({ where: { id }, paranoid: false })
	if(!prob) return res.status(404).json({ error: '문제를 찾을 수 없음' })
	return res.status(201).json({ prob })
}

const createProb = async (req, res, next) => {
	const { title, description, flag, author, score, tag } = req.body // tags는 객체 형태로 옴

	try {
		// 문제 생성
		const prob = await Prob.create({
			title, description, flag, author, tag, score
		}) 
	} catch (e) {
		console.error(e)
		next(e)
	}
	return res.status(201).json({ result : 'true' })
}

const updateProb = async (req, res, next) => {
	const id = req.params.id
	const { title, description, flag, author, score, tag, isOpen } = req.body
	// author는 외래 키이므로 디비에 어드민으로 존재하지 않는 경우 예외 처리 해야함
	try {
		if(isOpen == true)	// 문제를 열 경우 deleteAt = null
			Prob.restore({ where: { id } })
		const prob = await Prob.findOne({ where: { id }, paranoid: false })
		if(!prob) return res.status(404).json({ error : '존재하지 않는 문제 ' })
		if(title)
			Prob.update({ title, description, flag, author, score, tag }, { where: { id }, paranoid: false })	
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
	console.log(req.body)
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
	const body = req.body

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
				if(already)
					return res.status(201).json({ result: 'Already Solved' })
				if(prob.dataValues.flag === req.body.flag) {
					await Auth.create({ pid: id, solver: req.user.id, isCorrect: true })
					return res.status(201).json({ result: 'Correct!' })
				} else {
					await Auth.create({ pid: id, solver: req.user.id, isCorrect: false })
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
