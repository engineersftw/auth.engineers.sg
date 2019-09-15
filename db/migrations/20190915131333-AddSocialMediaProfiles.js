'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.addColumn('Users', 'githubProfileId', {
              type: Sequelize.STRING
          }, { transaction: t }),
          queryInterface.addColumn('Users', 'twitterProfileId', {
              type: Sequelize.STRING,
          }, { transaction: t })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.removeColumn('Users', 'githubProfileId', { transaction: t }),
          queryInterface.removeColumn('Users', 'twitterProfileId', { transaction: t })
      ])
    })
  }
};
