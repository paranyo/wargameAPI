const crypto = require('crypto')
const hashing = (str) => {
	return crypto.createHash('sha256').update("p@r@ny0" + str + "W@RG@M3").digest('hex')
}
module.exports = {
	hashing,
}
