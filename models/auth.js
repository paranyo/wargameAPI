module.exports = (sequelize, DataTypes) => (
	sequelize.define('auth', {
		flag: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		isCorrect: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
	}, {
		timestamps: true,
		paranoid: true
	})
)
