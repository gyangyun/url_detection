module.exports = function (sequelize, DataTypes) {
  var Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    display_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    underscored: true,
    tableName: 'permissions'
  })

  Permission.associate = function (models) {
    Permission.belongsToMany(models.Role, {through: 'permission_role'})
  }

  return Permission
}
