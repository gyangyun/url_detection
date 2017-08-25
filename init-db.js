const env = process.env.NODE_ENV || 'development'
const src = env === 'production' ? './build/models' : './src/models'
const db = require(src).default
const models = db
const faker = require('faker')

async function init () {
  // 新建表
  await db.sequelize.sync()

  // 新增角色，并绑定权限
  let role1 = await models.Role.create({
    name: 'admin',
    display_name: 'User Administrator',
    description: 'User is allowed to manage and edit other users'
  })
  let permission1 = await models.Permission.create({
    name: 'edit-users',
    display_name: 'Edit Users',
    description: 'edit existing users'
  })
  let role2 = await models.Role.create({
    name: 'normal:90qps',
    display_name: '90 QPS Normal User',
    description: 'User is allowed to view and edit the content, his ratelimit is 90qps'
  })
  let role3 = await models.Role.create({
    name: 'normal:900qpt',
    display_name: '900 QPT Normal User',
    description: 'User is allowed to view and edit the content, his ratelimit is 900qpt'
  })
  let role4 = await models.Role.create({
    name: 'normal:9000qph',
    display_name: '9000 QPH Normal User',
    description: 'User is allowed to view and edit the content, his ratelimit is 9000qph'
  })
  let role5 = await models.Role.create({
    name: 'normal:90000qpd',
    display_name: '90000 QPD Normal User',
    description: 'User is allowed to view and edit the content, his ratelimit is 90000qpd'
  })
  let role6 = await models.Role.create({
    name: 'normal:900000qpw',
    display_name: '900000 QPW Normal User',
    description: 'User is allowed to view and edit the content, his ratelimit is 900000qpw'
  })
  let role7 = await models.Role.create({
    name: 'normal:9000000qpm',
    display_name: '9000000 QPM Normal User',
    description: 'User is allowed to view and edit the content, his ratelimit is 9000000qpm'
  })
  let permission2 = await models.Permission.create({
    name: 'view-edit',
    display_name: 'View Edit',
    description: 'View and edit the content'
  })
  await role1.setPermissions([permission1, permission2])
  for (const role of [role2, role3, role4, role5, role6, role7]) {
    await role.addPermission(permission2)
  }

  // 新增管理用户，并绑定角色
  let user1 = await models.User.create({
    name: 'admin',
    email: 'admin@189.com',
    password: 'qwe123!Q'
  })
  await user1.addRole(role1)
  let user2 = await models.User.create({
    name: 'normal',
    email: 'normal@126.com',
    password: 'qwe123!Q'
  })
  await user2.addRole(role4)

  if (env !== 'production') {
    // 新增Fake测试数据
    let roles = await models.Role.findAll()
    for (var i = 0, len = 10; i < len; i++) {
      let tmpUser = await models.User.create({
        name: faker.name.firstName().toLowerCase(),
        email: faker.internet.email(),
        password: faker.lorem.words()
      })
      let tmpRole = roles[Math.floor(Math.random() * roles.length)]
      await tmpUser.addRole(tmpRole)
    }
  }

  console.log('db init over!')
}

init()
