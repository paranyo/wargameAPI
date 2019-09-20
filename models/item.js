module.exports = (sequelize, DataTypes) => (
	sequelize.define('item', {
		name: {
			type: DataTypes.STRING(256),
			allowNull: false,
		},
	}, {
		timestamps: true,
		paranoid: true
	})
)
