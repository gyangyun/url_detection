import logger from '../../utils/logger'
import util from 'util'
import redis from 'redis'
import config from 'config'

const log = logger(module)
const reportsController = {}
const redisUrl = config.get('Customer.redisUrl')
const client = redis.createClient(redisUrl)
client.select(1)

const clientHgetall = util.promisify(client.hgetall).bind(client)

function date2timestamp (date) {
  return date.toJSON().substring(0, 13).replace(/-|T/gi, '')
}

reportsController.show = async (ctx, next) => {
  try {
    let reports
    const rv = {}
    const timestamp = ctx.params.timestamp
    if (timestamp.match(/\d{10}/)) {
      reports = await clientHgetall(timestamp)
      reports = reports || {local: 0, cloud: 0, total: 0}
      rv[timestamp] = reports
      ctx.rest({
        code: 'success',
        message: 'Showed a report successfully',
        data: rv
      })
    } else {
      throw new ctx.APIError('reports:show_error', 'Timestamp format error')
    }
  } catch (e) {
    log.error(e)
    if (e instanceof ctx.APIError) {
      throw e
    } else {
      throw new ctx.APIError('reports:show_error', e)
    }
  }
}

reportsController.list = async (ctx, next) => {
  try {
    const rv = {}
    const startTimestamp = ctx.query.starttime
    const stopTimestamp = ctx.query.stoptime
    if (startTimestamp && stopTimestamp) {
      if (startTimestamp.match(/\d{10}/) && stopTimestamp.match(/\d{10}/)) {
        // const startTimestamp = '2017091200'
        // const stopTimestamp = '2017091402'
        const startDate = new Date(Date.parse(startTimestamp.substring(0, 4) + '-' + startTimestamp.substring(4, 6) + '-' + startTimestamp.substring(6, 8) + 'T' + startTimestamp.substring(8, 10) + ':00:00'))
        const stopDate = new Date(Date.parse(stopTimestamp.substring(0, 4) + '-' + stopTimestamp.substring(4, 6) + '-' + stopTimestamp.substring(6, 8) + 'T' + stopTimestamp.substring(8, 10) + ':00:00'))
        const hours = (stopDate - startDate) / 1000 / 60 / 60
        let timestamps = []

        for (let i = 0, len = hours; i < len + 1; i++) {
          timestamps.push(date2timestamp(startDate))
          startDate.setHours(startDate.getHours() + 1)
        }

        const result = await Promise.all(timestamps.map(timestamp => clientHgetall(timestamp))).catch([])
        for (let i = 0, len = timestamps.length; i < len; i++) {
          if (result[i]) {
            rv[timestamps[i]] = result[i]
          }
        }
        let totalLocal = 0
        let totalCloud = 0
        let totalTotal = 0
        for (var k in rv) {
          totalLocal += Number(rv[k]['local'])
          totalCloud += Number(rv[k]['cloud'])
          totalTotal += Number(rv[k]['total'])
        }
        rv[`${startTimestamp}-${stopTimestamp}`] = {total: totalTotal, local: totalLocal, cloud: totalCloud}
        ctx.rest({
          code: 'success',
          message: 'Showed some reports successfully',
          data: rv
        })
      } else {
        throw new ctx.APIError('reports:show_error', 'Timestamp format error')
      }
    } else {
      throw new ctx.APIError('reports:show_error', 'Query params error')
    }
  } catch (e) {
    log.error(e)
    if (e instanceof ctx.APIError) {
      throw e
    } else {
      throw new ctx.APIError('reports:show_error', e)
    }
  }
}

export default reportsController
