'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.addColumn('AuthTokens', 'codeVerifier', {
              type: Sequelize.STRING
          }, { transaction: t })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('AuthTokens', 'codeVerifier')
  }
};
