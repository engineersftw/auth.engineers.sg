const db = require('../models/index')
const request = require('supertest')
const app = require('../app')

const OauthService = require('../services/oauth_service')
const oauthService = new OauthService()

describe('/auth endpoints', () => {
  afterEach(async () => {
    await db.sequelize.query('truncate table "OauthApps"')
    await db.sequelize.query('truncate table "AuthTokens"')
    await db.sequelize.query('truncate table "Users"')
  })

  test('Auth endpoint to require client ID', (done) => {
    request(app)
      .get('/auth')
      .expect('Location', '/?errCode=MissingClientId')
      .expect(302, done)
  })

  describe('Positive case', () => {
    beforeEach(async () => {
      await db.OauthApp.create({
        name: 'My App',
        clientId: '12345',
        clientSecret: 'my_secret',
        redirectUri: 'http://example.com'
      })
    })

    test('Auth loads check page', (done) => {
      request(app)
        .get('/auth?client_id=12345&redirect_uri=http://example.com')
        .expect(200, done)
    })
  })

  describe('POST /auth/token', () => {
    let oauthApp; let newUser; let authToken; const codeVerifier = 'my_code_verifier'

    beforeEach(async () => {
      oauthApp = await db.OauthApp.create({
        name: 'My App',
        clientId: '12345',
        clientSecret: 'my_secret',
        redirectUri: 'http://example.com'
      })
      newUser = await db.User.create({
        firstName: 'Silly',
        lastName: 'Kat',
        email: 'sillykat@example.com'
      })

      authToken = await oauthService.createAuthToken(oauthApp, newUser.id, codeVerifier)
    })

    test('Exchange for access token', (done) => {
      request(app)
        .post('/auth/token')
        .send({
          client_id: oauthApp.clientId,
          client_secret: oauthApp.clientSecret,
          code: authToken.token,
          redirect_uri: oauthApp.redirectUri
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(response.body.access_token.length).toBeGreaterThan(0)
          expect(Object.keys(response.body)).toEqual(['access_token', 'token_type', 'expires_in', 'scope', 'data'])

          const jwtPayload = oauthService.verifyJWT(response.body.access_token)
          expect(jwtPayload.uid).toEqual(newUser.id)
          expect(jwtPayload.firstName).toEqual(newUser.firstName)
          expect(jwtPayload.lastName).toEqual(newUser.lastName)

          done()
        })
    })

    test('Exchange for access token with code_verifier', (done) => {
      request(app)
        .post('/auth/token')
        .send({
          client_id: oauthApp.clientId,
          code_verifier: codeVerifier,
          code: authToken.token,
          redirect_uri: oauthApp.redirectUri
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(response.body.access_token.length).toBeGreaterThan(0)
          expect(Object.keys(response.body)).toEqual(['access_token', 'token_type', 'expires_in', 'scope', 'data'])

          const jwtPayload = oauthService.verifyJWT(response.body.access_token)
          expect(jwtPayload.uid).toEqual(newUser.id)
          expect(jwtPayload.firstName).toEqual(newUser.firstName)
          expect(jwtPayload.lastName).toEqual(newUser.lastName)

          done()
        })
    })

    test('Invalid credentials', (done) => {
      request(app)
        .post('/auth/token')
        .send({
          client_id: oauthApp.clientId,
          client_secret: 'wrong_secret',
          code: authToken.token,
          redirect_uri: oauthApp.redirectUri
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .then(response => {
          expect(Object.keys(response.body)).toEqual(['errCode', 'message'])
          expect(response.body.message).toEqual('Invalid client credentials')

          done()
        })
    })

    test('Invalid Redirect URI', (done) => {
      request(app)
        .post('/auth/token')
        .send({
          client_id: oauthApp.clientId,
          client_secret: oauthApp.clientSecret,
          code: authToken.token,
          redirect_uri: 'http://wrong-url.com'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .then(response => {
          expect(Object.keys(response.body)).toEqual(['errCode', 'message'])
          expect(response.body.message).toEqual('Invalid redirect URI')

          done()
        })
    })

    test('Invalid Auth Token', (done) => {
      request(app)
        .post('/auth/token')
        .send({
          client_id: oauthApp.clientId,
          client_secret: oauthApp.clientSecret,
          code: 'wrong_code',
          redirect_uri: oauthApp.redirectUri
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .then(response => {
          expect(Object.keys(response.body)).toEqual(['errCode', 'message'])
          expect(response.body.message).toEqual('Invalid code')

          done()
        })
    })

    test('Invalid Code Verfier', (done) => {
      request(app)
        .post('/auth/token')
        .send({
          client_id: oauthApp.clientId,
          code_verifier: 'invalid_verifier',
          code: authToken.token,
          redirect_uri: oauthApp.redirectUri
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .then(response => {
          expect(Object.keys(response.body)).toEqual(['errCode', 'message'])
          expect(response.body.message).toEqual('Invalid code verifier')

          done()
        })
    })

    test('Missing code verifier & client secret', (done) => {
      request(app)
        .post('/auth/token')
        .send({
          client_id: oauthApp.clientId,
          code: authToken.token,
          redirect_uri: oauthApp.redirectUri
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .then(response => {
          expect(Object.keys(response.body)).toEqual(['errCode', 'message'])
          expect(response.body.message).toEqual('Invalid client credentials')

          done()
        })
    })
  })
})
