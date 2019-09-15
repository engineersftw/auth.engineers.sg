'use strict';

const bcrypt = require('bcrypt')
const saltRounds = 12

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Users', [{
      firstName: 'Admin',
      lastName: 'Tan',
      email: 'admin@techladies.co',
      passwordHash: bcrypt.hashSync('password1234', saltRounds),
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
