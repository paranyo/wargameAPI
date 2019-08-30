const getHash = (req, res, next) => {
	const { flag } = req.body
	if(flag)
		return res.status(201).json({ flag: flag })
}

module.exports = {
	getHash
}
