module.exports = (sequelize, DataTypes) => (
	sequelize.define('user', {
		uid: {
			type: DataTypes.STRING(40),
			allowNull: false,
			unique: true,
		},
		nick: {
			type: DataTypes.STRING(15),
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING(128),
			allowNull: true,
		},
		password: {
			type: DataTypes.STRING(256),
			allowNull: false,
		},
		ip: {
			type: DataTypes.STRING(15),
			allowNull: false,
		},
		level: {
			type: DataTypes.STRING(100),
			allowNull: true,
			defaultValue: "1",
		},
		money: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: true,
			defaultValue: 1000,
		}
	}, {
		timestamps: true,
		paranoid: true,	
	})
)
