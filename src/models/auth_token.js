'use strict'
module.exports = (sequelize, DataTypes) => {
  const AuthToken = sequelize.define('AuthToken', {
    clientId: DataTypes.STRING,
    token: DataTypes.STRING,
    validTill: DataTypes.DATE,
    userId: DataTypes.INTEGER,
    usedOn: DataTypes.DATE,
    codeVerifier: DataTypes.STRING,
    scope: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  }, {})
  AuthToken.associate = function (models) {
    models.AuthToken.belongsTo(models.User, {foreignKey: 'userId'})
  }
  return AuthToken
}
