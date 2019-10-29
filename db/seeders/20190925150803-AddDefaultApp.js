'use strict';

const crypto = require('crypto')

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('OauthApps', [{
        name: 'ESG CMS',
        clientId: crypto.randomBytes(20).toString('hex'),
        clientSecret: crypto.randomBytes(20).toString('hex'),
        active: true,
        redirectUri: 'https://cms.engineers.sg/auth/callback',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('OauthApps', null, {});
  }
};
