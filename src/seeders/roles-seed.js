const { roles } = require('../fakers/roles')

const rolesSeed = async (tenant) => await tenant('roles').insert(roles)

module.exports = rolesSeed
