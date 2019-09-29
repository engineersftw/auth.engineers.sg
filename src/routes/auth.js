const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const passport = require('passport')
const db = require('../models/index')

const OauthService = require('../services/oauth_service')
const oauthService = new OauthService()

function renderSuccess (req, res, user, token, authCode) {
  const returnURL = req.session.returnURL || process.env.DEFAULT_RETURN_URL || 'https://engineers.sg'

  let fullReturnURL = returnURL
  if (authCode.length > 0) {

    const prefix = returnURL.indexOf('?') > 0 ? '&' : '?'
    fullReturnURL = `${returnURL}${prefix}code=${authCode}`
  }

  req.session.destroy()

  // Saves a new JWT Token
  return res.set({
    'X-JWT-TOKEN': token
  }).render('success', {
    title: 'Engineers.SG - Successful Login',
    returnURL: fullReturnURL,
    user: user,
    token: token,
    authCode: authCode
  })
}

function renderError (res, message, code = 401) {
  return res.status(code).render('index', {
    title: 'Engineers.SG - Login Failure',
    errMessage: message
  })
}

function loginCallback (req, res, err, user) {
  if (err || !user) {
    return renderError(res, 'Please check your login credentials.')
  }
  req.login(user, { session: false }, async (err) => {
    if (err) {
      return renderError(res, err)
    }

    let authCode = ''
    if (req.session.clientId) {
      try {
        const oauthApp = await oauthService.fetchApp(req.session.clientId)
        const newAuthToken = await oauthService.createAuthToken(oauthApp, user.uid)

        authCode = newAuthToken.token
      } catch (err) {
        return renderError(res, err)
      }
    }

    const token = oauthService.signJWT(user)
    return renderSuccess(req, res, user, token, authCode)
  })
}

// Check for existing JWT token in LocalStorage
// - If valid JWT exists, create AuthToken & redirect to return_uri
// - Otherwise redirect to login form
router.get('/', async function (req, res, next) {
  const { client_id, redirect_uri, code_challenge, scope, state } = req.query

  const result = {
    title: 'Engineers.SG - Checking for user session',
    cancelURL: '/'
  }

  try {
    if (!client_id) {
      return res.redirect('/?errCode=MissingClientId')
    }

    const oauthApp = await oauthService.fetchApp(client_id)
    if (!oauthApp) {
      return res.redirect('/?errCode=MissingClientId')
    }

    if (!redirect_uri || oauthApp.redirectUri !== redirect_uri) {
      return res.redirect('/?errCode=MissingRedirectUri')
    } else {
      req.session.returnURL = redirect_uri
    }

    req.session.clientId = oauthApp.clientId

    result.oauthApp = oauthApp
  } catch (err) {
    return res.redirect('/?errCode=Others&message=' + err.message)
  }

  res.render('check', result)
})

// Checks the JWT token from LocalStorage
// If valid, create AuthToken and return to client
router.post('/', async function (req, res, next) {
  const result = {
    returnURL: req.session.returnURL || process.env.DEFAULT_RETURN_URL || 'https://engineers.sg'
  }

  try {
    const userData = oauthService.verifyJWT(req.body.token)
    const oauthApp = await oauthService.fetchApp(req.body.clientId)
    const newAuthToken = await oauthService.createAuthToken(oauthApp, userData.uid)

    result.authCode = newAuthToken.token
  } catch (err) {
    result.errCode = 'InvalidToken'
    result.message = 'Invalid token found'
    res.status(401)
  }

  req.session.destroy((err) => {
    res.json(result)
  })
})

// Exchange the AuthToken for a JWT Access Token
router.post('/token', async function (req, res, next) {
  const { client_id, client_secret, code, redirect_uri, code_verifier } = req.body

  let result = {
    access_token: '',
    token_type: 'bearer',
    expires_in: 3600,
    scope: 'default'
  }

  try {
    const oauthApp = await oauthService.fetchApp(client_id)

    if (!code_verifier && oauthApp.clientSecret !== client_secret) {
      throw new Error('Invalid client credentials')
    }

    if (!redirect_uri || oauthApp.redirectUri !== redirect_uri) {
      throw new Error('Invalid redirect URI')
    }

    const authToken = await oauthService.fetchAuthToken(client_id, code)
    if (!authToken) {
      throw new Error('Invalid code')
    }

    if (code_verifier && authToken.codeVerifier !== code_verifier) {
      throw new Error('Invalid code verifier')
    }

    const user = await authToken.getUser()
    const jwtPayload = {
      uid: user.id,
      firstName: user.firstName,
      lastName: user.lastName
    }

    result.access_token = oauthService.signJWT(jwtPayload)
  } catch (err) {
    result = {
      errCode: 'Error',
      message: err.message
    }
    res.status(401)
  }

  res.json(result)
})

// Email Login action
router.post('/login', function (req, res, next) {
  passport.authenticate('local', { session: false }, (err, user) => loginCallback(req, res, err, user))(req, res)
})

// Start GitHub Login
router.get('/github', function (req, res, next) {
  passport.authenticate('github', { scope: ['user:email'] })(req, res)
})

router.get('/github/callback', function (req, res, next) {
  passport.authenticate('github', { session: false }, (err, user) => loginCallback(req, res, err, user))(req, res)
})

// Start Twitter Login
router.get('/twitter', passport.authenticate('twitter'))

router.get('/twitter/callback', function (req, res, next) {
  passport.authenticate('twitter', { session: false }, (err, user) => loginCallback(req, res, err, user))(req, res)
})

// Clears LocalStorage of any tokens
router.get('/logout', function (req, res, next) {
  req.session.destroy((err) => {
    res.render('logout', {
      title: 'Engineers.SG - Logging Out',
      returnURL: '/'
    })
  })
})

module.exports = router
