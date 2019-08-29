const { User, Sequelize: { Op } } = require('../models')
const auth   = require('../auth')
const crypto = require('crypto')
const { hashing } = require('../hashing')

const getHash = (req, res, next) => {
	const { flag } = req.body
	if(flag)
		return res.status(201).json({ hash: hashing(flag) })
}

module.exports = {
	getHash
}
