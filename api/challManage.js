const { Prob, Tag } = require('../models')
const { hashing } = require('../hashing')


const getProbs = async (req, res) => {
	const { cid } = req.params
	if(!cid) return res.status(404).json({ error: '무슨 카테고리?' });
	const list = await Probs.find({ category: cid })
	const cate = await ChallCate.findOne({ title: cid })
	res.status(201).json({ list, cate })
}

const getProb = async(req, res) => {
	const { pid } = req.params
	if(!pid) return res.status(404).json({ error : '문제를 찾을 수 없음' })
	const prob = await Probs.findOne({ _id: pid })
	res.json({ prob })
}

const create = async (req, res) => {
	const { title, description, flag, author, score } = req.body
}

const updateProb = async (req, res) => {
	const { pid } = req.params
	let body			= req.body
	if(typeof(body.flag) != "undefined") body.flag = hashing(body.flag)
	let prob			= await Probs.findOne({ _id: pid })
	if(!prob) return res.status(404).json({ error : '존재하지 않는 문제 ' })
	Object.keys(body).forEach(key => {
		let value = body[key]
		if(typeof value === 'string') value= value.trim()
		if(!value) return
		prob[key] = value
	})
	await prob.save()
	res.json({ prob })
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
	create,
	getProbs,
	getProb,
	updateProb,/*
	authProb,*/
}
