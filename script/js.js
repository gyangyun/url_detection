const axios = require('axios')

// 获取jwt_token
console.log('====================' + '下面进行jwt获取测试' + '====================')

let jwtToken = ''
axios.post('http://127.0.0.1:3000/auth/token', {
    username: 'act',
    password: 'qwe123!Q',
    grant_type: 'password'
}).then((response) => {
    jwtToken = response.data['access_token']
})
console.log('获取到jwt:'+jwtToken)

// 单域名查询
console.log('====================' + '下面进行单域名查询测试' + '====================')

axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`
axios.get('http://127.0.0.1:3000/api/records?dname=oimdztrab.qnssl.com')
  .then(function (response) {
    console.log(response.status)
    console.log(response.headers)
    console.log(response.data)
  })
  .catch(function (error) {
    console.log(error)
  })

// 多域名查询
console.log('====================' + '下面进行多域名查询测试' + '====================')

axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`
const data = ['www.baidu.com?w=check', 'www.qq.com', 'http://www.163.com']
axios.post('http://127.0.0.1:3000/api/records/queries', data)
  .then(function (response) {
    console.log(response.status)
    console.log(response.headers)
    console.log(response.data)
  })
  .catch(function (error) {
    console.log(error)
  })
