const db = require('../models/index')
const request = require('supertest')
const app = require('../app')

describe('/auth endpoints', () => {
  test('Auth endpoint to require client ID', (done) => {
    request(app)
      .get('/auth')
      .expect('Location', '/?errCode=MissingClientId')
      .expect(302, done)
  })
  describe('Positive case', () => {
    let oauthApp
    beforeEach(async () => {
      oauthApp = await db.OauthApp.create({
        name: 'My App',
        clientId: '12345',
        clientSecret: 'my_secret',
        redirectUri: 'http://example.com'
      })
    })

    afterEach(async () => {
      await oauthApp.destroy()
    })

    test('Auth loads check page', (done) => {
      request(app)
        .get('/auth?client_id=12345&redirect_uri=http://example.com')
        .expect(200, done)
    })
  })
})
