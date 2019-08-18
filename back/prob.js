module.exports = (sequelize, DataTypes) => (
	sequelize.define('prob', {
		title: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		src: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		score: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: 0,
		},
		flag: {
			type: DataTypes.STRING(256),
			allowNull: true,
		}
	}, {
		timestamps: true,
		paranoid: true
	})
)
