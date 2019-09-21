module.exports = (sequelize, DataTypes) => (
	sequelize.define('inventory', {
		isEquip: {
			type: DataTypes.INTEGER(1).ZEROFILL.UNSIGNED,
		},
	}, {
		timestamps: true,
		paranoid: true,	
	})
)
