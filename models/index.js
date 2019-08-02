const Sequelize = require('sequelize')
const env				= process.env.NODE_ENV || 'development'
const config		= require('../config/config')[env]
const db				= {}

const sequelize	= new Sequelize(
	config.database, config.username, config.password, config,
)

db.sequelize = sequelize
db.Sequelize = Sequelize

db.User = require('./user')(sequelize, Sequelize)
db.Prob	= require('./prob')(sequelize, Sequelize)
db.Tag	= require('./tag')(sequelize, Sequelize)

db.User.hasMany(db.Prob,	 { foreignKey: 'author', sourceKey: 'uid'})
db.Prob.belongsTo(db.User, { foreignKey: 'author', sourceKey: 'uid'})
db.Prob.belongsToMany(db.Tag, { through: 'ProbTag' })
db.Tag.belongsToMany(db.Prob, { through: 'ProbTag' })

module.exports = db
