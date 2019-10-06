require('dotenv').config()

const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const cors = require('cors')
const session = require('express-session')
const passport = require('./passport')

const indexRouter = require('./routes/index')
const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')

const app = express()

if (process.env.NODE_ENV === 'production') {
  const Sentry = require('@sentry/node')
  Sentry.init({ dsn: process.env.SENTRY_DSN })
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.errorHandler())
}

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

app.use(cors())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

if (process.env.NODE_ENV === 'test') {
  app.use(
    session({
      secret: process.env.EXPRESS_SESSION_SECRET,
      resave: true,
      saveUninitialized: true
    })
  )
} else {
  const redis = require('redis')
  const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

  const RedisStore = require('connect-redis')(session)
  const redisclient = redis.createClient(REDIS_URL)

  app.use(
    session({
      store: new RedisStore({ client: redisclient }),
      secret: process.env.EXPRESS_SESSION_SECRET,
      resave: false,
      saveUninitialized: true
    })
  )
}

app.use('/', indexRouter)
app.use('/auth', authRouter)
app.use('/user', passport.authenticate('jwt', { session: false }), usersRouter)

app.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('My first Sentry error!')
})

module.exports = app
