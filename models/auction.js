module.exports = (sequelize, DataTypes) => (
	sequelize.define('auction', {
		price: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
		},
		end: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	}, {
		timestamps: true,
		paranoid: true
	})
)
