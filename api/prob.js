const { Auth, User, Prob, Tag, Sequelize: { Op } } = require('../models')


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
	if(!id) return res.status(404).json({ error : '문제를 찾을 수 없음' })
	const prob = await Prob.findOne({ where: { id }, paranoid: false })
	if(!prob) return res.status(404).json({ error: '문제를 찾을 수 없음' })
	return res.status(201).json({ prob })
}


const createProb = async (req, res, next) => {
	const { title, description, flag, author, score, tagId, isOpen } = req.body // tags는 객체 형태로 옴

	try {
		// 문제 생성
		let deletedAt = null
		if(isOpen == false)
			deletedAt = new Date()
		const prob = await Prob.create({
			title, description, flag, author, tagId, score, deletedAt
		}) 
	} catch (e) {
		console.error(e)
		next(e)
	}
	return res.status(201).json({ result : 'true' })
}

const updateProb = async (req, res, next) => {
	const id = req.params.id
	const { title, description, flag, author, score, tagId, isOpen } = req.body
	// author는 외래 키이므로 디비에 어드민으로 존재하지 않는 경우 예외 처리 해야함
	try {
		if(isOpen == true)	// 문제를 열 경우 deleteAt = null
			Prob.restore({ where: { id } })
		const prob = await Prob.findOne({ where: { id }, paranoid: false })
		if(!prob) return res.status(404).json({ error : '존재하지 않는 문제 ' })
		if(title)
			Prob.update({ title, description, flag, author, score, tagId }, { where: { id }, paranoid: false })	
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
				if(already) {
					if(prob.dataValues.flag === req.body.flag)
						return res.status(201).json({ result: 'Already Solved, But Correct!' })
					else 
						return res.status(201).json({ result: 'Already Solved and Incorrect!' })
				}
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
