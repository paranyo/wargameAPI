module.exports = (sequelize, DataTypes) => (
	sequelize.define('bid', {
		cost: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
	}, {
		timestamps: true,
		paranoid: true	
	})
)
