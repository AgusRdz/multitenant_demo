const rolesTable = require('./roles-table')
const usersTable = require('./users-table')

const migrate = async (tenant) => {
  await rolesTable(tenant)
  await usersTable(tenant)
}

module.exports = migrate
