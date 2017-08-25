import Router from 'koa-router'
import addRoutes from '../../utils/routes'
import { isJwtAuthenticated } from '../../controllers/auth'
// import ratelimit from '../../middlewares/ratelimit2'
// import redis from 'redis'
// import config from 'config'

// const redisUrl = config.get('Customer.redisUrl')
// const client = redis.createClient(redisUrl)

// const ratelimiter = ratelimit({
  // db: client,
  // duration: function (context) {
    // return context.state.user.duration
  // },
  // max: function (context) {
    // return context.state.user.max
  // },
  // id: function (context) {
    // return context.state.user.name
  // },
  // headers: {
    // remaining: 'Rate-Limit-Remaining',
    // reset: 'Rate-Limit-Reset',
    // total: 'Rate-Limit-Total'
  // },
  // errorMessage: 'Sometimes You Just Have to Slow Down.'
// })

const router = Router({
  prefix: 'api'
})
// router.use('/', isJwtAuthenticated(), ratelimiter)
router.use('/', isJwtAuthenticated())
addRoutes(router, __dirname, __filename)

export default router
