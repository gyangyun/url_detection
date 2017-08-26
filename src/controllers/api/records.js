import logger from '../../utils/logger'
import util from 'util'
import redis from 'redis'
import config from 'config'
import { getDomain } from 'tldjs'

const log = logger(module)
const recordsController = {}
const redisUrl = config.get('Customer.redisUrl')
const tldWhitelist = config.get('Customer.tldWhitelist')
const limitQueries = config.get('Customer.limitQueries')
const SDKEnable = config.get('Customer.SDKEnable')
const client = redis.createClient(redisUrl)
client.select(1)

const clientHgetall = util.promisify(client.hgetall).bind(client)
const clientHmset = util.promisify(client.hmset).bind(client)
const clientExpire = util.promisify(client.expire).bind(client)

const patternUrl = /^.*(?:[^\.\/\\:]+\.){1,}[^\.\/\\:?]+/

let detect
if (SDKEnable) {
  const tctapi = require('tctapi')
  tctapi.init('./licence.conf', 'cloud')
  // detect = util.promisify(tctapi.detectAsync)
  detect = util.promisify(tctapi.detectSync)
}

recordsController.show = async (ctx, next) => {
  try {
    let rv = {}
    const url = ctx.query.url
    const urlMatch = url.match(patternUrl)
    if (urlMatch) {
      // 第二次白名单过滤
      if (tldWhitelist.includes(getDomain(url))) {
        rv = {url: url, urlType: 3, evilClass: 0}
      } else {
        // 第三次Redis过滤
        const record = await clientHgetall(url)
        if (record) {
          rv = {url: url, urlType: record['urlType'], evilClass: record['evilClass']}
        } else {
          // 第四次SDK过滤
          if (SDKEnable) {
            const record = await detect(url)
            if (record['evilClass'] !== 0 || record['urlType'] === 3 || record['urlType'] === 4) {
              await clientHmset(url, record)
              await clientExpire(url, 60 * 60 * 24 * 7)
            }
            rv = {url: url, urlType: record['urlType'], evilClass: record['evilClass']}
          } else {
            rv = {url: url, urlType: 1, evilClass: 0}
          }
        }
      }
    } else {
      // 第一次合法域名过滤
      rv = {url: url, urlType: 1, evilClass: 0}
    }
    ctx.rest({
      code: 'success',
      message: 'Showed a domain name successfully',
      data: rv
    })
  } catch (e) {
    log.error(e)
    if (e instanceof ctx.APIError) {
      throw e
    } else {
      throw new ctx.APIError('records:show_error', e)
    }
  }
}

recordsController.display = async (ctx, next) => {
  try {
    const urls = ctx.request.body
    if (urls.length > limitQueries) {
      throw new ctx.APIError('records:display_error', 'MAX limit 20/request')
    }
    // 这里采用forEach的方式进行不规范的域名分组
    // 第一次合法域名过滤
    // 过滤出合法域名，生成filterUrls1
    const filterdUrls1 = urls.filter(url => url.match(patternUrl))
    // 非法域名直接返回未知
    const result1 = urls.filter(url => !(filterdUrls1.includes(url))).map(url => ({url: url, urlType: 1, evilClass: 0}))

    // 第二次白名单过滤
    // 过滤出白名单中“不存在”的域名，生成filterUrls2
    const filterdUrls2 = filterdUrls1.filter(url => !(tldWhitelist.includes(getDomain(url))))
    // (上次的filterdUrls1 - filterdUrls2)则是白名单中“存在 ”的域名，则返回安全
    const result2 = filterdUrls1.filter(url => !(filterdUrls2.includes(url))).map(url => ({url: url, urlType: 3, evilClass: 0}))

    // 第三次Redis过滤，这里需要并行异步查询Redis
    const resultRedisOld = await Promise.all(filterdUrls2.map(url => clientHgetall(url))).catch([])
    const resultRedis = resultRedisOld.filter(x => x ? true : false)
    const result3 = resultRedis.map(record => ({url: record['url'], urlType: record['urlType'], evilClass: record['evilClass']}))
    // (上次的filterdUrls2 - Redis中查到记录的)则是Redis中“不存在”的域名，生成filterUrls3
    const filterdUrls3 = filterdUrls2.filter(url => !(result3.map(record => record['url']).includes(url)))

    let result4 = []
    // 第四次SDK过滤
    if (SDKEnable) {
      const resultSDKOld = await Promise.all(filterdUrls3.map(url => detect(url))).catch([])
      const resultSDK = resultSDKOld.filter(x => x ? true : false)
      const resultSDKLite = resultSDK.filter(record => (record['evilClass'] !== 0 || record['urlType'] === 3 || record['urlType'] === 4))
      // Redis中“存在”的域名返回查询结果
      await Promise.all(resultSDKLite.map(record => {
        clientHmset(record['url'], record)
      }))
      await Promise.all(resultSDKLite.map(record => {
        clientExpire(record['url'], 60 * 60 * 24 * 7)
      }))
      // SDK中“存在”的域名返回查询结果
      result4 = resultSDK.map(record => ({url: record['url'], urlType: record['urlType'], evilClass: record['evilClass']}))
      // (上次的filterdUrls3 - SDK中查到记录的)则是SDK中“不存在”的域名，生成filterUrls4，但是认为SDK是最后一个环节，未知的它也会返回
      // const filterdUrls4 = filterdUrls3.filter(url => !(result4.map(record => record['url']).includes(url)))
    } else {
      result4 = filterdUrls3.map(url => ({url: url, urlType: 1, evilClass: 0}))
    }

    const rv = [...result1, ...result2, ...result3, ...result4]
    ctx.rest({
      code: 'success',
      message: 'Displayed some domain names successfully',
      data: rv
    })
  } catch (e) {
    log.error(e)
    if (e instanceof ctx.APIError) {
      throw e
    } else {
      throw new ctx.APIError('records:display_error', e)
    }
  }
}

export default recordsController
