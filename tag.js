module.exports = (sequelize, DataTypes) => (
	sequelize.define('tag', {
		name: {
			type: DataTypes.STRING(15),
			allowNull: false,
			unique: true,
		}
	}, {
		timestamps: true,
		paranoid: true,	
	})
)
