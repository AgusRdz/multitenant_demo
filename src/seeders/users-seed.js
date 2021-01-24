const { users } = require('../fakers/users')

const usersSeed = async (tenant) => await tenant('users').insert(users(10))

module.exports = usersSeed
