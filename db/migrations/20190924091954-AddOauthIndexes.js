'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.addIndex('OauthApps', ['clientId'], { unique: true, name: 'oauthapps_clientId', transaction: t }),
          queryInterface.addIndex('AuthTokens', ['clientId','token'], { unique: true, name: 'authtokens_clientId_token', transaction: t })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.removeIndex('OauthApps', 'oauthapps_clientId', { transaction: t }),
          queryInterface.removeIndex('AuthTokens', 'authtokens_clientId_token', { transaction: t })
      ])
    })
  }
};
