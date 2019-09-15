'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('Users', ['email'], { unique: true, name: 'users_email' })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('Users', 'users_email')
  }
};
