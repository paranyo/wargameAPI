const { ErrorLog } = require('./models')
module.exports = async (err) => {
	const { sql, code, errno, sqlState, sqlMessage } = err.original
	await ErrorLog.create({ sql, code, errno, sqlState, sqlMessage })
}
