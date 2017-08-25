import Router from 'koa-router'
import { token } from '../../controllers/auth/oauth2'

const router = Router({
  prefix: 'auth'
})

router.post('/token', token())

export default router
