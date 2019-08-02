const { Tag, Sequelize: { Op }}	= require('../models')
const { hashing }								= require('../hashing')


const createTag = async (req, res, next) => {
	const { title } = req.body
	try {
		const exTag = await Tag.find({ where: { title } })
		if(exTag) return res.status(401).json({ error: '이미 있는 태그입니다' })

		await Tag.create({ title })
		return res.status(201).json({ result: true })
	} catch (error) {
		console.error(error)
		return res.status(401).json({ error: '태그 생성 실패' })
	}
}

const getTags = async (req, res, next) => {
	try {
		const list = await Tag.findAll()
		if(list)
			return res.status(201).json({ list })
	} catch (error) {
		console.error(error)
		return res.status(401).json({ error: '태그를 가져올 수 없습니다.' })
	}

}

const updateTag = async (req, res, next) => {
	const { title, after, isOpen } = req.body
	try {
		if(isOpen == 'true')
			Tag.restore({ title: title })
	
		const exTag = await Tag.findOne({ where: { title } })
		if(!exTag) return res.status(401).json({ error: '없는 태그입니다.' })

		Tag.update({ title: after },{ where: { title } })
	
		if(isOpen == 'false')
			Tag.destroy({ where: { title } })

		return res.status(201).json({ result: 'true' })
	} catch(error) {
		console.error(error)
		return res.status(401).json({ error: '수정할 수 없습니다.' })
	}
}

/*
	updateTag에서 대체할 수 있는 기능이므로 비활성화
const deleteTag = async (req, res, next) => {
	const { title } = req.body
	try {
		Tag.destroy({ where: { title } })
		return res.status(201).json({ result: 'true' })
	} catch(error) {
		console.error(error)
		return res.status(401).json({ error: '삭제할 수 없습니다.' })
	}
}*/

module.exports = {
	getTags,
	createTag,
	updateTag,
	/*deleteTag,*/
}
