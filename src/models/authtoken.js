'use strict';
module.exports = (sequelize, DataTypes) => {
  const AuthToken = sequelize.define('AuthToken', {
    clientId: DataTypes.STRING,
    token: DataTypes.STRING,
    validTill: DataTypes.DATE,
    userId: DataTypes.INTEGER,
    usedOn: DataTypes.DATE,
    scope: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  }, {});
  AuthToken.associate = function(models) {
    // associations can be defined here
  };
  return AuthToken;
};