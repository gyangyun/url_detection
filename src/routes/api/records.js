import recordsController from '../../controllers/api/records'

export default (router) => {
  router.get('/records', recordsController.show)
  router.post('/records/queries', recordsController.display)
}
