const Sequelize = require('sequelize')
const path			= require('path')
const env				= process.env.NODE_ENV || 'development'
const config		= require(path.join(__dirname, '..', 'config', 'config.json'))[env]
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
db.Tag.hasMany(db.Prob,		 { foreignKey: 'tag',  sourceKey: 'id', as: 'tagName' })
db.Prob.belongsTo(db.Prob, { foreignKey: 'tag',  sourceKey: 'id'})

module.exports = db
