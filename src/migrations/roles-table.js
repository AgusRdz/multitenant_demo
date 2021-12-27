const rolesTable = async (tenant) => {
  await tenant.schema.createTable('roles', (table) => {
    table.increments()
    table.string('name')
    table.timestamps(true, true)
  })
}

module.exports = rolesTable
