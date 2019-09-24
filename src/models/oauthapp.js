'use strict';
module.exports = (sequelize, DataTypes) => {
  const OauthApp = sequelize.define('OauthApp', {
    name: DataTypes.STRING,
    clientId: DataTypes.STRING,
    clientSecret: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    redirectUri: DataTypes.STRING
  }, {});
  OauthApp.associate = function(models) {
    // associations can be defined here
  };
  return OauthApp;
};