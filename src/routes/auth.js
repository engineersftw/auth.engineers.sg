const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const passport = require('passport')

function renderSuccess(res, user, token) {
  const returnURL = 'https://engineers.sg' // TODO: This should be fetching from session.
  const authCode = 'ABCDEF' // TODO: This should be dynamically generated

  const prefix = returnURL.indexOf('?') > 0 ? '&' : '?'
  const fullReturnURL = `${returnURL}${prefix}code=${authCode}`

  return res.set({
    'X-JWT-TOKEN': token,
  }).render('success', {
    title: 'Engineers.SG - Successful Login',
    returnURL: fullReturnURL,
    user: user,
    token: token,
    authCode: authCode
  })
}

function renderError(res, message, code = 401) {
  return res.status(code).render('index', {
    title: 'Engineers.SG - Login Failure',
    errMessage: message
  })
}

function loginCallback(res, req, err, user) {
  if (err || !user) {
    return renderError(res, 'Please check your login credentials.')
  }
  req.login(user, { session: false }, (err) => {
    if (err) {
      return renderError(res, err)
    }
    const token = jwt.sign(user, process.env.JWT_SECRET)
    return renderSuccess(res, user, token)
  })
}

router.get('/', function (req, res, next) {
  res.render('check', {
    title: 'Engineers.SG - Checking for user session',
    cancelURL: '/'
  })
})

router.post('/', function (req, res, next) {
  const result = {
    returnURL: 'https://engineers.sg' // TODO: This should be fetching from session.
  }

  try {
    var decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);
    result.authCode = 'ABCDEF' // TODO: This should be dynamically generated
  } catch(err) {
    result.errCode = 'InvalidToken'
    result.message = 'Invalid token found'
    res.status(401)
  }

  res.json(result)
})

router.post('/login', function (req, res, next) {
  passport.authenticate('local', { session: false }, (err, user) => loginCallback(res, req, err, user))(req, res)
})

router.get('/github', function (req, res, next) {
  passport.authenticate('github', { scope: [ 'user:email' ] })(req, res)
})

router.get('/github/callback', function (req, res, next) {
  passport.authenticate('github', { session: false }, (err, user) => loginCallback(res, req, err, user))(req, res)
})

router.get('/twitter', passport.authenticate('twitter'))

router.get('/twitter/callback', function (req, res, next) {
  passport.authenticate('twitter', { session: false }, (err, user) => loginCallback(res, req, err, user))(req, res)
})

router.get('/logout', function (req, res, next) {
  res.render('logout', {
    title: 'Engineers.SG - Logging Out',
    returnURL: '/'
  })
})

module.exports = router
