const db = require('../models/index')
const crypto = require('crypto')
const moment = require('moment')
const jwt = require('jsonwebtoken')

class OauthService {
  constructor (options = {}) {
    this.JWT_SECRET = options['JWT_SECRET'] || process.env.JWT_SECRET
  }

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

  async createAuthToken (app, userId, codeVerifier = '') {
    return db.AuthToken.create({
      clientId: app.clientId,
      token: OauthService.generateHash(),
      codeVerifier: codeVerifier,
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

  verifyJWT (token) {
    return jwt.verify(token, this.JWT_SECRET)
  }

  signJWT (payload) {
    return jwt.sign(payload, this.JWT_SECRET)
  }
}

module.exports = OauthService