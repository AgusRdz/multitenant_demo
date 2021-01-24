const rolesTable = async (tenant) => {
  await tenant.schema.createTable('roles', (table) => {
    table.increments()
    table.string('name')
    table.timestamps()
  })
}

module.exports = rolesTable
