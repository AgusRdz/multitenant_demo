const rolesSeed = require('./roles-seed')
const usersSeed = require('./users-seed')

const seed = async (tenant) => {
  await rolesSeed(tenant)
  await usersSeed(tenant)
}

module.exports = seed
