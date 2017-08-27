echo "====================下面进行jwt获取测试===================="
export JWT_TOKEN=$(http POST 127.0.0.1:3000/auth/token username='act' password='qwe123!Q' grant_type='password' | awk -F'"' '{print $4}' | egrep -v "Bearer|^$")
echo "获取到jwt:$JWT_TOKEN"

echo "====================下面进行单域名查询测试===================="
http 127.0.0.1:3000/api/records?dname=www.baidu.com Authorization:"Bearer $JWT_TOKEN"

echo "====================下面进行多域名查询测试===================="
echo '["www.baidu.com?kw=act", "www.qq.com", "http://www.163.com", "at."]' | http POST 127.0.0.1:3000/api/records/queries Authorization:"Bearer $JWT_TOKEN"
