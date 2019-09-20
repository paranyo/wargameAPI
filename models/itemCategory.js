module.exports = (sequelize, DataTypes) => (
	sequelize.define('itemCategory', {
		id: {
			type: DataTypes.INTEGER(1).ZEROFILL.UNSIGNED,
			autoIncrement: true,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING(16),
			allowNull: false,
			unique: true,
		},
	}, {
		timestamps: true,
		paranoid: true,	
	})
)
