module.exports = (sequelize, DataTypes) => (
	sequelize.define('file', {
		originName: {
			type: DataTypes.STRING(256),
			allowNull: false,
		},
		saveName: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		size: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	}, {
		timestamps: true,
		paranoid: true
	})
)
