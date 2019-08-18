const Sequelize = require('sequelize')
const env				= process.env.NODE_ENV || 'development'
const config		= require('../config/config')[env]
const db				= {}

const sequelize	= new Sequelize(
	config.database, config.username, config.password, config, { operatorsAliases: false }
)

db.sequelize = sequelize
db.Sequelize = Sequelize

db.User = require('./user')(sequelize, Sequelize)
db.Prob	= require('./prob')(sequelize, Sequelize)
db.Tag	= require('./tag')(sequelize, Sequelize)

db.User.hasMany(db.Prob,	 { foreignKey: 'author', sourceKey: 'uid'})
db.Prob.belongsTo(db.User, { foreignKey: 'author', sourceKey: 'uid'})
db.Tag.hasMany(db.Prob,		 { foreignKey: 'title',  sourceKey: 'name'})
db.Prob.belongsTo(db.Prob, { foreignKey: 'title',  sourceKey: 'name'})

module.exports = db
