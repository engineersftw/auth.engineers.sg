'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.addIndex('Users', ['githubProfileId'], { unique: true, name: 'users_githubProfileId', transaction: t }),
          queryInterface.addIndex('Users', ['twitterProfileId'], { unique: true, name: 'users_twitterProfileId', transaction: t })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.removeIndex('Users', 'users_githubProfileId', { transaction: t }),
          queryInterface.removeIndex('Users', 'users_twitterProfileId', { transaction: t })
      ])
    })
  }
};
