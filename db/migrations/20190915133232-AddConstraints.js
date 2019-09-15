'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addConstraint('Users', ['githubProfileId'], { type: 'unique', name: 'constraint_users_githubProfileId', transaction: t }),
        queryInterface.addConstraint('Users', ['twitterProfileId'], { type: 'unique', name: 'constraint_users_twitterProfileId', transaction: t }),
        queryInterface.addConstraint('Users', ['email'], { type: 'unique', name: 'constraint_users_email', transaction: t })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeConstraint('Users', 'constraint_users_githubProfileId', { transaction: t }),
        queryInterface.removeConstraint('Users', 'constraint_users_twitterProfileId', { transaction: t }),
        queryInterface.removeConstraint('Users', 'constraint_users_email', { transaction: t })
      ])
    })
  }
};
