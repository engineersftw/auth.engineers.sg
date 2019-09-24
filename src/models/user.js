'use strict'
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    passwordHash: DataTypes.STRING,
    githubProfileId: DataTypes.STRING,
    twitterProfileId: DataTypes.STRING
  }, {})
  User.associate = function (models) {
    models.User.hasMany(models.AuthToken, {foreignKey: 'userId'})
  }
  return User
}
