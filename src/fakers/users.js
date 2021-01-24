const faker = require('faker')

const getRandomRole = () => Math.floor(Math.random() * 3) + 1

const users = (num = 1) => {
  const randomUsers = []

  for (let i = 0; i < num; i++) {
    const user = {
      email: faker.internet.email(),
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      password: faker.internet.password(),
      role_id: getRandomRole()
    }
    randomUsers.push(user)
  }

  return randomUsers
}

module.exports = { users }
