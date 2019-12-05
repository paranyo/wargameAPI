module.exports = (sequelize, DataTypes) => (
	sequelize.define('notice', {
		title: {
			type: DataTypes.STRING(128),
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
	}, {
		timestamps: true,
		paranoid: true
	})
)
