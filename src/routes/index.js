const express = require('express')
const router = express.Router()

function displayErrorMessage(errCode, customMessage = '') {
  let message = ''
  switch (errCode) {
    case 'NoLocalSession':
      message = 'Please login to your account'
      break
    case 'InvalidToken':
        message = 'Invalid token found. Please login again.'
        break
    case 'Others':
      message = customMessage
      break
    default:
      message = 'Something went wrong'
      break
  }

  return message
}

router.get('/', function (req, res, next) {
  const pageData = { title: 'Engineers.SG' }
  if (req.query.errCode) {
    pageData.errMessage = displayErrorMessage(errCode, req.query.message)
  }
  res.render('index', pageData)
})

module.exports = router
