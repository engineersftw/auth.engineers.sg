const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const GitHubStrategy = require('passport-github2').Strategy
const TwitterStrategy = require('passport-twitter').Strategy

const passportJWT = require('passport-jwt')
const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

const db = require('./models/index')
const bcrypt = require('bcrypt')

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
async function (email, password, cb) {
  const user = await db.User.findOne({ where: { email } })

  if (user && bcrypt.compareSync(password, user.passwordHash)) {
    const jwtPayload = {
      uid: user.id,
      firstName: user.firstName,
      lastName: user.lastName
    }

    return cb(null, jwtPayload, { message: 'Logged In Successfully' })
  } else {
    return cb(null, false, { message: 'Incorrect email or password.' })
  }
}
))

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.PASSPORT_CALLBACK_DOMAIN}/auth/github/callback`
},
async function(accessToken, refreshToken, profile, cb) {
  let [ user, err ] = await db.User.findOrCreate({
    where: {
      githubProfileId: profile.id
    }
  })

  if (err) {
    console.error('Error', err)
  }

  await user.update({
    email: profile.emails[0].value,
    firstName: profile.displayName
  })

  const jwtPayload = {
    uid: user.id,
    firstName: user.firstName,
    lastName: user.lastName
  }

  return cb(null, jwtPayload)
}
))

passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: `${process.env.PASSPORT_CALLBACK_DOMAIN}/auth/twitter/callback`
},
async function(token, tokenSecret, profile, cb) {
  let [ user, err ] = await db.User.findOrCreate({
    where: {
      twitterProfileId: profile.id
    }
  })

  if (err) {
    console.error('Error', err)
  }

  await user.update({
    email: `${profile.username}@twitter-user.engineers.sg`,
    firstName: profile.displayName
  })

  const jwtPayload = {
    uid: user.id,
    firstName: user.firstName,
    lastName: user.lastName
  }

  return cb(null, jwtPayload)
}
));

passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
},
function (jwtPayload, cb) {
  return cb(null, jwtPayload)
}
))

module.exports = passport
