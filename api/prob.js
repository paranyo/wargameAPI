const { Prob, Tag } = require('../models')
const { hashing } = require('../hashing')


const getProbs = async (req, res) => {
	const list =  await Prob.findAll()
	return res.status(201).json({ list })
}

const getProb = async(req, res, next) => {
	const { id } = req.params
	if(!id) return res.status(404).json({ error : '문제를 찾을 수 없음' })
	const prob = await Prob.findOne({ where: { id } })
	if(!prob) return res.status(404).json({ error: '문제를 찾을 수 없음' })
	return res.status(201).json({ prob })
}

const createProb = async (req, res, next) => {
	const { title, description, flag, author, score, tags } = req.body // tags는 객체 형태로 옴
	try {	
		// 문제 생성
		const prob = await Prob.create({
			title, description, flag: hashing(flag), author, score
		})
		console.log(tags)
		if(tags) { // 생성한 태그가 목록에 없을 경우, 생성.
			const result = await Promise.all(tags.map(tag => Tag.findOrCreate({ where: { title: tag } })))
			await prob.addTags(result.map(r => r[0]))
		} 
	} catch (e) {
		console.error(e)
		next(e)
	}
	return res.status(201).json({ result : 'true' })
}

const updateProb = async (req, res, next) => {
	const { id, title, description, flag, author, score, tags, isOpen } = req.body
	try {

		if(isOpen == 'true')	// 문제를 열 경우 deleteAt = null
			Prob.restore({ where: { id } })

		const prob = await Prob.findOne({ where: { id } })
		if(!prob) return res.status(404).json({ error : '존재하지 않는 문제 ' })
		Prob.update({ title, description, flag: hashing(flag), author, score }, { where: { id } })	// 문제 업데이트
	

		// ProbTag 일단은 디비 모두 삭제하고 잇는 거추가하는 식으로 했는데 나중에 간추릴 수 있으면 더 간추리는 걸로,,
		const tagDB = await Tag.findAll()
		await prob.removeTags(tagDB.map(v => v.id))
		const result = await Promise.all(tags.map(tag => Tag.findOrCreate({ where: { title: tag } })))
		await prob.addTags(result.map(r => r[0]))
		if(isOpen == 'false') // 문제를 닫을 경우 수정 후 닫기 위해 destroy 나중에 함
			Prob.destroy({ where: { id } })

	} catch(e) {
		console.error(e)
		next(e)
	}
		
}
/*
const authProb = async(req, res) => {
	const { pid } = req.params
	const body = req.body
	if(typeof(body.flag) != "undefined") body.flag = hashing(body.flag)
	const prob = await Probs.findOne({ _id: pid })
	console.log(prob.flag)
	console.log(body.flag)
	if(prob.flag == body.flag)
		res.status(201).json({ msg: 'correct' })
	else
		res.status(201).json({ msg: 'incorrect' })
}

*/
module.exports = {
	getProbs,
	getProb,
	createProb,
	updateProb,/*
	authProb,*/
}
