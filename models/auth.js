module.exports = (sequelize, DataTypes) => (
	sequelize.define('auth', {
		isCorrect: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
	}, {
		timestamps: true,
		paranoid: true
	})
)
