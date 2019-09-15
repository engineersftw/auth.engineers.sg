const express = require('express')
const router = express.Router()
const debug = require('debug')('app:users')

router.get('/', function (req, res, next) {
  debug('Hello World!')

  res.json(req.user)
})

module.exports = router
