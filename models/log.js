module.exports = (sequelize, DataTypes) => (
	sequelize.define('log', {
		ipAddress: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		userAgent: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		referer: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		token: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		data: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		url: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		method: {
			type: DataTypes.STRING(16),
			allowNull: true
		},
	}, {
		timestamps: true,
		paranoid: true
	})
)
