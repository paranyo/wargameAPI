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
db.Log	= require('./log')(sequelize, Sequelize)
db.Auth = require('./auth')(sequelize, Sequelize)

db.Item					= require('./item')(sequelize, Sequelize)
db.ItemCategory	=	require('./itemCategory')(sequelize, Sequelize)
db.Inventory		= require('./inventory')(sequelize, Sequelize)

db.User.hasMany(db.Prob,	 { foreignKey: 'author', sourceKey: 'uid'})
db.Prob.belongsTo(db.User, { foreignKey: 'author', sourceKey: 'uid'})

db.Tag.hasMany(db.Prob,		 { foreignKey: 'tagId',  sourceKey: 'id'})
db.Prob.belongsTo(db.Tag,  { foreignKey: 'tagId',  sourceKey: 'id'})

db.User.hasMany(db.Auth,	 { foreignKey: 'solver', sourceKey: 'uid' })
db.Auth.belongsTo(db.User, { foreignKey: 'solver', sourceKey: 'uid' })

db.Prob.hasMany(db.Auth,	 { foreignKey: 'pid', sourceKey: 'id' })
db.Auth.belongsTo(db.Prob, { foreignKey: 'pid', sourceKey: 'id' })

db.ItemCategory.hasMany(db.Item,	{ foreignKey: 'cCode', sourceKey: 'id' })
db.Item.belongsTo(db.ItemCategory,{ foreignKey:	'cCode', sourceKey: 'id' })

db.Item.hasMany(db.Inventory,		{ foreignKey: 'itemCode', sourceKey: 'id' })
db.Inventory.belongsTo(db.Item,	{ foreignKey: 'itemCode', sourceKey: 'id' })
db.User.hasMany(db.Inventory,		{	foreginKey: 'userId',		sourceKey: 'uid' })
db.Inventory.belongsTo(db.User,	{ foreginKey: 'userId',		sourceKey: 'uid' })
db.ItemCategory.hasMany(db.Inventory,		{ foreignKey: 'cCode', sourceKey: 'id' })
db.Inventory.belongsTo(db.ItemCategory,	{ foreignKey: 'cCode', sourceKey: 'id' })

module.exports = db
