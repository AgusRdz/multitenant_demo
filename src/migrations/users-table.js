const usersTable = async (tenant) => {
  await tenant.schema.createTable('users', (table) => {
    table.increments()
    table.string('email').unique()
    table.string('first_name')
    table.string('last_name')
    table.string('password')
    table.integer('role_id')
    table.timestamps()
    table.foreign('role_id').references('id').inTable('roles')
  })
}

module.exports = usersTable
