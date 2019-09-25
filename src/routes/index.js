const express = require('express')
const router = express.Router()

const OauthService = require('../services/oauth_service')
const oauthService = new OauthService()

function displayErrorMessage (errCode, customMessage = '') {
  let message = ''
  switch (errCode) {
    case 'NoLocalSession':
      message = 'Please login to your account'
      break
    case 'InvalidToken':
      message = 'Invalid token found. Please login again.'
      break
    case 'MissingClientId':
      message = 'Please include a valid client ID in the request'
      break
    case 'MissingRedirectUri':
      message = 'Please include a valid redirect URI in the request'
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

async function fetchOauthApp (clientId) {
  try {
    const oauthApp = await oauthService.fetchApp(clientId)
    if (oauthApp) { return oauthApp }
  } catch (err) {
    console.log(err)
  }

  return null
}

router.get('/', async function (req, res, next) {
  if (req.query.redirect_uri) {
    req.session.returnURL = req.query.redirect_uri
  }

  if (req.query.client_id) {
    const oauthApp = await fetchOauthApp(req.query.client_id)

    if (oauthApp) {
      req.session.clientId = oauthApp.clientId
      req.session.returnURL = oauthApp.redirect_uri
    }
  }

  const pageData = { title: 'Engineers.SG' }
  if (req.query.errCode) {
    pageData.errMessage = displayErrorMessage(req.query.errCode, req.query.message)
  }
  res.render('index', pageData)
})

module.exports = router
