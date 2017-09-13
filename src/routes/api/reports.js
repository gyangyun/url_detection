import reportsController from '../../controllers/api/reports'

export default (router) => {
  router.get('/reports/:timestamp', reportsController.show)
  router.get('/reports', reportsController.list)
}
