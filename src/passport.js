const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const GitHubStrategy = require('passport-github2').Strategy

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
  callbackURL: "http://localhost:3001/auth/github/callback"
},
async function(accessToken, refreshToken, profile, done) {
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

  // profile.username

  const jwtPayload = {
    uid: user.id,
    firstName: user.firstName,
    lastName: user.lastName
  }

  return done(null, jwtPayload)
}
))

passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
},
function (jwtPayload, cb) {
  return cb(null, jwtPayload)
}
))

module.exports = passport
