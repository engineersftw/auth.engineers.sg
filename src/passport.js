const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

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

passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
},
function (jwtPayload, cb) {
  return cb(null, jwtPayload)
}
))

module.exports = passport
