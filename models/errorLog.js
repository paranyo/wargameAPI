module.exports = (sequelize, DataTypes) => (
	sequelize.define('errorLog', {
		errno: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		code: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		sqlState: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		sqlMessage: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		sql: {
			type: DataTypes.TEXT,
			allowNull: true
		},
	}, {
		timestamps: true,
		paranoid: true
	})
)
