module.exports = (sequelize, DataTypes) => (
	sequelize.define('setting', {
		name: {
			type: DataTypes.STRING(32),
			allowNull: false,
			unique: true,
		},
		value: {
			type: DataTypes.TEXT,
			allowNull: false,
		}
	}, {
		timestamps: true,
		paranoid: true,	
	})
)
