const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const passport = require('passport')

function renderSuccess(res, user, token) {
  return res.set({
    'X-JWT-TOKEN': token
  }).render('success', {
    title: 'Engineers.SG - Successful Login',
    returnUrl: 'https://engineers.sg',
    user: user,
    token: token
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

module.exports = router
