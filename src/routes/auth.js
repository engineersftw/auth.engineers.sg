const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const passport = require('passport')

router.post('/login', function (req, res, next) {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: 'Something is not right',
        user: user
      })
    }
    req.login(user, { session: false }, (err) => {
      if (err) {
        res.send(err)
      }
      // generate a signed son web token with the contents of user object and return it in the response
      const token = jwt.sign(user, process.env.JWT_SECRET)
      return res.json({ user, token })
    })
  })(req, res)
})

router.get('/github', function (req, res, next) {
  passport.authenticate('github', { scope: [ 'user:email' ] })(req, res)
})

router.get('/github/callback', function (req, res, next) {
  passport.authenticate('github', { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        message: 'Something is not right',
        user: user
      })
    }
    req.login(user, { session: false }, (err) => {
      if (err) {
        res.send(err)
      }
      // generate a signed son web token with the contents of user object and return it in the response
      const token = jwt.sign(user, process.env.JWT_SECRET)
      return res.json({ user, token })
    })
  })(req, res)
})

module.exports = router