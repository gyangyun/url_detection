import requests

#  获取jwt_token
print('='*20 + '下面进行jwt获取测试' + '='*20)

url = 'http://127.0.0.1:3000/auth/token'
payload = {
    'username': 'act',
    'password': 'qwe123!Q',
    'grant_type': 'password'
}
r = requests.post(url, data=payload)
jwt_token = r.json()['access_token']
print('获取到jwt：' + jwt_token)

#  单域名查询
print('='*20 + '下面进行单域名查询测试' + '='*20)

url = 'http://127.0.0.1:3000/api/records'
payload = {
    'dname': 'oimdztrab.qnssl.com'
}
headers = {
    'Authorization': 'Bearer {}'.format(jwt_token)
}
r = requests.get(url, params=payload, headers=headers)

print(r.reason)
print(r.headers)
print(r.json())

#  多域名查询
print('='*20 + '下面进行多域名查询测试' + '='*20)

url = 'http://127.0.0.1:3000/api/records/queries'
data = ['www.baidu.com?w=check', 'www.qq.com', 'http://www.163.com', 'https://sequelize.readthedocs.io/en/v3/docs/instances']
headers = {
    'Authorization': 'Bearer {}'.format(jwt_token)
}
r = requests.post(url=url, headers=headers, json=data)

print(r.reason)
print(r.headers)
print(r.json())
