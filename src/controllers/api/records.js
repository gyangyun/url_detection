import logger from '../../utils/logger'
import util from 'util'
import redis from 'redis'
import config from 'config'
import { getDomain } from 'tldjs'

const log = logger(module)
const recordsController = {}
const redisUrl = config.get('Customer.redisUrl')
const tldWhitelist = config.get('Customer.tldWhitelist')
const client = redis.createClient(redisUrl)
client.select(1)

const clientHgetall = util.promisify(client.hgetall).bind(client)
const clientHmset = util.promisify(client.hmset).bind(client)

const patternUrl = /^.*(?:[^\.\/\\:]+\.){1,}[^\.\/\\:?]+/

recordsController.show = async (ctx, next) => {
/* 注意这里有两个正则：
正则1. 规范dname，只要域名，不需要协议类型，例如http://www.baidu.com，则只需要baidu.com，此外防止别人使用api查询时使用垃圾数据，导致将大量垃圾数据写入数据库
正则2. 有些域名的二级域名仍然是公用顶级域名，此时获取三级域名 */
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
        const urlLite = urlMatch[0]
        const record = await clientHgetall(urlLite)
        if (record) {
          rv = {url: url, urlType: record['urlType'], evilClass: record['evilClass']}
        } else {
          // 第四次SDK过滤
          rv = {url: url, urlType: 0, evilClass: 0}
        }
      }
    } else {
      // 第一次合法域名过滤
      rv = {url: url, urlType: 0, evilClass: 0}
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
    const rvOld = new Map()
    // rvOld.set('http://www.baidu.com/s?=sssss', {url: 'www.baidu.com', notDone: false, urlLite: 'www.baidu.com'})
    // rvOld.set('www.qq.com', {url: 'www.qq.com', notDone: true, urlLite: 'www.qq.com'})
    // rvOld.set('www.189.cn', {url: 'www.189.cn', notDone: true, urlLite: 'www.189.cn'})
    // rvOld.set('www.bilibili.com', {url: 'www.bilibili.com', notDone: false, urlLite: 'www.bilibili.com'})
    if (urls.length > 20) {
      throw new ctx.APIError('records:display_error', 'MAX limit 20/request')
    }
    // 这里采用forEach的方式进行不规范的域名分组
    // 第一次合法域名过滤
    urls.map(url => {
      try {
        rvOld.set(url, {urlLite: url.match(patternUrl)[0], url: url, notDone: true})
      } catch (e) {
        rvOld.set(url, {url: url, urlType: 0, evilClass: 0, notDone: false})
      }
    })

    // 第二次白名单过滤
    for (const [key, value] of rvOld) {
       if (value['notDone']) {
        if (tldWhitelist.includes(getDomain(key))) {
          value['urlType'] = 3
          value['evilClass'] = 0
          value['notDone'] = false
        }
      }
    }
    // 第三次Redis过滤，Redis只存域名和站点级别，这里需要并行异步查询Redis
    const mapTmp = new Map()
    const filtered3 = [...rvOld.values()].filter(obj => obj['notDone'])
    filtered3.forEach(obj => mapTmp.set(obj['urlLite'], obj['url']))
    const resultRedis = await Promise.all([...mapTmp.keys()].map(urlLite => clientHgetall(urlLite))).catch([])
    resultRedis.filter(x => x ? true : false).forEach(record => {
      rvOld.get(mapTmp.get(record['url']))['urlType'] = record['urlType']
      rvOld.get(mapTmp.get(record['url']))['evilClass'] = record['evilClass']
      rvOld.get(mapTmp.get(record['url']))['notDone'] = false
    })
    // 第四次进行SDK过滤
    // 待添加:  <25-08-17, GuoYangyun> //
    for (const [key, value] of rvOld) {
       if (value['notDone']) {
        value['urlType'] = 0
        value['evilClass'] = 0
        value['notDone'] = false
      }
    }
    const rv = [...rvOld.values()].map(obj => ({
      url: obj['url'],
      urlType: obj['urlType'],
      evilClass: obj['evilClass']
    }))
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
