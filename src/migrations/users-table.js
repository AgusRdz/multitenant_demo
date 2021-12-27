const usersTable = async (tenant) => {
  await tenant.schema.createTable('users', (table) => {
    table.increments()
    table.string('email').unique()
    table.string('first_name')
    table.string('last_name')
    table.string('password')
    table.specificType('role_id', 'int(10) unsigned')
    table.timestamps(true, true)
    table.foreign('role_id').references('id').inTable('roles')
  })
}

module.exports = usersTable
