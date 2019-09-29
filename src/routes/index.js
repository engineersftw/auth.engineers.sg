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
  const { clientId, redirectUri, state, codeVerifier, scope } = req.query

  if (redirectUri) {
    req.session.returnURL = redirectUri
  }

  if (clientId) {
    const oauthApp = await fetchOauthApp(clientId)

    if (oauthApp) {
      req.session.clientId = oauthApp.clientId
      req.session.returnURL = oauthApp.redirectUri

      if (state) { req.session.state = state }
      if (codeVerifier) { req.session.state = codeVerifier }
      if (scope) { req.session.scope = scope }
    }
  }

  const pageData = { title: 'Engineers.SG' }
  const { errCode, message } = req.query
  if (errCode) {
    pageData.errMessage = displayErrorMessage(errCode, message)
  }
  res.render('index', pageData)
})

module.exports = router
