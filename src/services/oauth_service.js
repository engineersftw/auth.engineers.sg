const db = require('../models/index')
const crypto = require('crypto')
const moment = require('moment')

class OauthService {
  static generateHash() {
    return crypto.randomBytes(20).toString('hex')
  }

  async createApp (name, redirectUri) {
    return db.OauthApp.create({
      name: name,
      clientId: OauthService.generateHash(),
      clientSecret: OauthService.generateHash(),
      active: true,
      redirectUri: redirectUri
    })
  }

  async fetchApp (clientId) {
    return db.OauthApp
      .findOne({
        where: {
          clientId: clientId
        }
      })
  }

  async createAuthToken (app, userId) {
    return db.AuthToken.create({
      clientId: app.clientId,
      token: OauthService.generateHash(),
      validTill: moment().add(5, 'm'),
      userId: userId,
      scope: '',
      active: true
    })
  }

  async fetchAuthToken (clientId, token) {
    return db.AuthToken
      .findOne({
        where: {
          clientId: clientId,
          token: token
        }
      })
  }
}

module.exports = OauthService