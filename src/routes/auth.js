const express = require('express')
const router = express.Router()
const passport = require('passport')

const OauthService = require('../services/oauth_service')
const oauthService = new OauthService()

function renderSuccess (req, res, user, token, authCode) {
  const { returnURL, state } = req.session

  let fullReturnURL = returnURL || process.env.DEFAULT_RETURN_URL || 'https://engineers.sg'

  if (authCode.length > 0) {
    const prefix = fullReturnURL.indexOf('?') > 0 ? '&' : '?'
    fullReturnURL += `${prefix}code=${authCode}&`

    if (state) {
      fullReturnURL += `state=${state}&`
    }
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
    if (err) { return renderError(res, err) }

    let authCode = ''

    const { clientId, codeVerifier } = req.session
    if (clientId) {
      try {
        const oauthApp = await oauthService.fetchApp(clientId)
        const newAuthToken = await oauthService.createAuthToken(oauthApp, user.uid, codeVerifier)

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
  const { client_id: clientId, redirect_uri: redirectUri, code_challenge: codeVerifier, scope, state } = req.query

  const result = {
    title: 'Engineers.SG - Checking for user session',
    cancelURL: '/',
    loginURL: '/?'
  }

  try {
    if (!clientId) {
      return res.redirect('/?errCode=MissingClientId')
    }

    const oauthApp = await oauthService.fetchApp(clientId)
    if (!oauthApp) {
      return res.redirect('/?errCode=MissingClientId')
    }

    if (!redirectUri || oauthApp.redirectUri !== redirectUri) {
      return res.redirect('/?errCode=MissingRedirectUri')
    }

    result.oauth = {
      clientId: oauthApp.clientId,
      redirectUri: oauthApp.redirectUri
    }

    result.loginURL += `clientId=${oauthApp.clientId}&redirectUri=${oauthApp.redirectUri}`

    if (state) {
      result.oauth.state = state
      result.loginURL += `state=${state}&`
    }
    if (codeVerifier) {
      result.oauth.codeVerifier = codeVerifier
      result.loginURL += `codeVerifier=${codeVerifier}&`
    }
    if (scope) {
      result.oauth.scope = scope
      result.loginURL += `scope=${scope}&`
    }

    result.oauthApp = oauthApp
  } catch (err) {
    return res.redirect('/?errCode=Others&message=' + err.message)
  }

  res.render('check', result)
})

// Checks the JWT token from LocalStorage
// If valid, create AuthToken and return to client
router.post('/', async function (req, res, next) {
  const { token, clientId, redirectUri, codeVerifier, state } = req.body

  const result = {
    returnURL: redirectUri || process.env.DEFAULT_RETURN_URL || 'https://engineers.sg'
  }

  result.returnURL += result.returnURL.indexOf('?') > 0 ? '&' : '?'
  if (state) {
    result.returnURL += `state=${state}&`
  }

  try {
    const userData = oauthService.verifyJWT(token)
    const oauthApp = await oauthService.fetchApp(clientId)
    const newAuthToken = await oauthService.createAuthToken(oauthApp, userData.uid, codeVerifier)

    result.authCode = newAuthToken.token
    result.returnURL += `code=${newAuthToken.token}&`
  } catch (err) {
    result.errCode = 'InvalidToken'
    result.message = 'Invalid token found'
    res.status(401)
  }

  req.session.destroy(() => {
    res.json(result)
  })
})

// Exchange the AuthToken for a JWT Access Token
router.post('/token', async function (req, res, next) {
  const { client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, code_verifier: codeVerifier } = req.body

  let result = {
    access_token: '',
    token_type: 'bearer',
    expires_in: 3600,
    scope: 'default'
  }

  try {
    const oauthApp = await oauthService.fetchApp(clientId)

    if (!codeVerifier && oauthApp.clientSecret !== clientSecret) {
      throw new Error('Invalid client credentials')
    }

    if (!redirectUri || oauthApp.redirectUri !== redirectUri) {
      throw new Error('Invalid redirect URI')
    }

    const authToken = await oauthService.fetchAuthToken(clientId, code)
    if (!authToken) {
      throw new Error('Invalid code')
    }

    if (codeVerifier && authToken.codeVerifier !== codeVerifier) {
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
  req.session.destroy(() => {
    res.render('logout', {
      title: 'Engineers.SG - Logging Out',
      returnURL: '/'
    })
  })
})

module.exports = router
