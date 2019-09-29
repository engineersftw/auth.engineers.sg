const OauthService = require('./oauth_service')
const db = require('../models/index')

describe('OauthService', () => {
  let subject
  beforeEach(() => {
    subject = new OauthService()
  })

  afterEach(async () => {
    await db.sequelize.query('truncate table "OauthApps"')
    await db.sequelize.query('truncate table "AuthTokens"')
    await db.sequelize.query('truncate table "Users"')
  })

  test('Generates a hash', () => {
    expect(OauthService.generateHash()).toBeTruthy()
  })

  describe('#createApp', () => {
    test('Creates new Oauth app', async () => {
      const name = 'ESG CMS'
      const redirectUri = 'https://cms.engineers.sg/auth/callback'
      const result = await subject.createApp(name, redirectUri)

      expect(result).toBeTruthy()
      expect(result.name).toEqual(name)
      expect(result.redirectUri).toEqual(redirectUri)
      expect(await db.OauthApp.count()).toEqual(1)
    })
  })

  describe('with existing app', () => {
    let newApp
    const name = 'ESG CMS'
    const redirectUri = 'https://cms.engineers.sg/auth/callback'

    beforeEach(async () => {
      newApp = await subject.createApp(name, redirectUri)
    })

    describe('#fetchApp', () => {
      test('Fetches a specific app', async () => {
        const result = await subject.fetchApp(newApp.clientId)

        expect(result).toBeTruthy()
        expect(result.name).toEqual(name)
        expect(result.redirectUri).toEqual(redirectUri)
      })
    })

    describe('#createAuthToken', () => {
      test('Creates a new AuthToken', async () => {
        const userId = 1
        const result = await subject.createAuthToken(newApp, userId)

        expect(result).toBeTruthy()
        expect(result.clientId).toEqual(newApp.clientId)
        expect(result.validTill.getTime()).toBeGreaterThan((new Date()).getTime())
      })
    })

    describe('#fetchAuthToken', () => {
      let newUser
      let authToken

      beforeEach(async () => {
        newUser = await db.User.create({
          firstName: 'Silly',
          lastName: 'Kat',
          email: 'sillykat@example.com'
        })
        authToken = await subject.createAuthToken(newApp, newUser.id)
      })

      test('Fetches an existing AuthToken', async () => {
        const result = await subject.fetchAuthToken(newApp.clientId, authToken.token)

        expect(result).toBeTruthy()
        expect(result.clientId).toEqual(newApp.clientId)

        const tokenUser = await result.getUser()
        expect(tokenUser.firstName).toEqual(newUser.firstName)
        expect(tokenUser.email).toEqual(newUser.email)
      })
    })
  })
})
