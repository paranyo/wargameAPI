const { Setting, ErrorLog, File, Auth, Log, Sequelize: { Op }, sequelize } = require('../models')
const path = require('path')
const shell = require('shelljs')
const { hashing } = require('../hashing')
const getHash = (req, res, next) => {
	const { flag } = req.body
	if(flag)
		return res.status(201).json({ flag: hashing(flag) })
}

const getLog = async (req, res, next) => {
	const { type } = req.body
	try {
		let logs
		if(type == 'auth')
			logs = await Auth.findAll()
		else if(type == 'all')
			logs = await Log.findAll()
		else if(type == 'error')
			logs = await ErrorLog.findAll()
		return res.status(201).json({ logs })
	} catch(e) {
		console.error(e)
		next(e)
	}
}

const getFile	= async (req, res, next) => {
	return res.status(203).json(await File.findAll({ attributes: ['id', 'originName', 'saveName', 'createdAt', 'uploader', 'size', 'deletedAt'] }))
}

const uploadFile = async (req, res, next) => {
	try {
		if(req.user && req.file) {
			const uploader	 = req.user.id
			const originName = req.file.originalname
			const size			 = req.file.size
			const saveName	 = req.file.filename
			await File.create({ originName, uploader, size, saveName })
			return res.status(203).json({ result: true })
		}
	} catch(e) {
		console.error(e)
		next(e)
	}
}

const removeFile = async (req, res, next) => {
	const { id } = req.body
	try {
		const file = await File.findOne({ where: { id } })
		if(!file) return res.status(403).json({ result: '파일이 존재하지 않아요' })
		if(shell.exec('rm ./public/files/' + file.dataValues.saveName).code !== 0) {
			shell.echo('\n\n\n\nError\n\n\n\n')
			shell.exit(1)
		}
		await File.destroy({ where: { id } })
		return res.status(203).json({ result: true })
	} catch(e) {
		next(e)
	}
}

const setSetting = async (req, res, next) => {
	const { name, value } = req.body
	if(!name || !value) return res.status(403).json({ result: false })
	try {
		await Setting.create({ name, value })
		return res.status(203).json({ result: true })
	} catch(e) {
		next(e)
	}
}

const getSetting = async (req, res, next) => {
	try {
		let settings = await Setting.findAll({ attributes: ['id','name', 'value'] })
		if(settings) return res.status(203).json({ settings })
		else				return res.status(403).json({ result: false })
	} catch(e) {
		next(e)
	}

}

const updateSetting = async (req, res, next) => {
	const { name, value } = req.body
	if(!name || !value) return res.status(403).json({ result: false })
	try {
		await Setting.update({ value }, { where: { name } })
		return res.status(203).json({ result: true })
	} catch(e) {
		next(e)
	}
}
/*
const dbClear = async (req, res, next) => {
	try {
		let clear = [
			'DELETE FROM users WHERE uid!="paranyo"',
			'DELETE FROM auctions',
			'DELETE FROM auths',
			'DELETE FROM bids',
			'DELETE FROM errorLogs',
			'DELETE FROM files',
			'DELETE FROM inventories WHERE userId!="paranyo"',
			'DELETE FROM logs',
			'DELETE FROM notices WHERE id!=1',
			'DELETE FROM probs',
			'DELETE FROM shops',
			'DELETE FROM tags',
		]
		let tbs = ['users', 'auctions', 'auths', 'bids', 'errorLogs', 'files', 'inventories', 'logs', 'notices', 'probs', 'shops', 'tags']
		for(let i = 0; i < clear.length; i++) {
			await sequelize.query(clear[i])
			console.log('\n\n\n!! ' + tbs[i]  + ' CLEAR !! \n\n\n')
		}
		let autoIncrements = []
		for(let i = 0; i < tbs.length; i++) {
			 autoIncrements = [
				'ALTER TABLE '+tbs[i]+' AUTO_INCREMENT=1',
				'SET @COUNT=0',
				'UPDATE '+tbs[i]+' SET id=@COUNT:=@COUNT+1'
			]
			for(let j =0; j < autoIncrements.length; j++) {
				await sequelize.query(autoIncrements[j])
			}
			console.log('\n\n\n!! ' + tbs[i]  + ' SET AUTO_INCREMENT !! \n\n\n')
		}
	} catch(err) {
		console.error(err)	
	}
} */
module.exports = {
	getHash,
	getLog,
	getFile,
	uploadFile,
	removeFile,
	setSetting,
	getSetting,
	updateSetting,
}
