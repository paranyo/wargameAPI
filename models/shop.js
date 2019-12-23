module.exports = (sequelize, DataTypes) => (
	sequelize.define('shop', {
		price: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
		},
		pdCount: {
			type: DataTypes.INTEGER(11).UNSIGNED,
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		deadLine: {
			type: DataTypes.DATE,
			allowNull: true,
		},
	}, {
		timestamps: true,
		paranoid: true
	})
)
