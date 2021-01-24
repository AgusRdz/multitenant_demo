# Multi-tenant through Node.js and PostgreSQL

### Can February march? No, but April may. 😂

I know, it was a terrible joke but I also know if you following read this article you will learn the basis to how to create your own basic multi-tenant API.

### How it works a multi-tenant architecture?

Well, basically you have a codebase running in a shared infrastructure but keeping isolated a database for each client. Think in Jira, Jira is the most popular online tool for managing project tasks, tracking errors and issues, and for operational project management where each organization has their own dashboard accessed via custom subdomain where A and B have access to the same features, receives the same updates, but the issues, tickets, comments, users, etc. of A cannot be accessed by B and vice-versa.
Slack is other example of multi-tenancy and works in the same way like Jira does... of course in this case we will talking about users, channels, PM, notifications, etc.

### When you must to use multi-tenancy?

Just imagine you has been working for a long time in awesome application that can be offered as a SaaS, there are different ways to offer a SaaS application but if your software needs keep a database isolated, but providing the same features to each customer, then needs it.

### Why?

One of the benefits of the multi-tenant application is the maintainability of the code base because the code will always be the same for all clients, if a client reports a problem, the solution will be applied to their other 999 clients. _Just note that if you enter an error, it will also apply to all clients._
And what happens with the administration of the database, maybe it could be a little more complicated, but following the appropriate patterns and conventions, everything will be fine, there are different approaches to managing databases (segregation in distributed servers, databases of separate data sets, a database but separate schemas, row isolation) and of course each has pros and cons.

### You wanna code?

I selected the separate databases as database approach because I think is easier for this example, also, due the `sequelize` requires a lot of configuration I used `knex` instead.

I going to focus on the specific files required to do the multi tenancy workflow.

- create the common database to manage the tenants:

```sql
CREATE DATABASE tenants_app;

CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(255) UNIQUE NOT NULL,
  db_name VARCHAR(100) UNIQUE NOT NULL,
  db_username VARCHAR(100),
  db_password TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

- `database.js`: establishes the connection to the main database

```js
const knex = require('knex')
const config = {
  client: process.env.DB_CLIENT,
  connection: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD
  }
}
const db = kenx(config)
module.exports = { db, config }
```

- `connection-service.js`: used to prepare the tenant database connection, in other words the connection used to run queries in the proper database

```js
const knex = require('knex')
const { getNamespace } = require('continuation-local-storage')
const { db, config } = require('../config/database')
let tenantMapping

const getConfig = (tenant) => {
  const { db_username: user, db_name: database, db_password: password } = tenant

  return {
    ...config,
    connection: {
      ...config.connection,
      user,
      database,
      password
    }
  }
}

const getConnection = () => getNamespace('tenants').get('connection') || null

const bootstrap = async () => {
  try {
    const tenants = await db
      .select('uuid', 'db_name', 'db_username', 'db_password')
      .from('tenants')

    tenantMapping = tenants.map((tenant) => ({
      uuid: tenant.uuid,
      connection: knex(getConfig(tenant))
    }))
  } catch (e) {
    console.error(e)
  }
}

const getTenantConnection = (uuid) => {
  const tenant = tenantMapping.find((tenant) => tenant.uuid === uuid)

  if (!tenant) return null

  return tenant.connection
}
```

- `tenant-service.js`: used to create a database for each new client, using the same database structure and used too delete it if is required.

```js
const Queue = require('bull')
const { db } = require('../config/database')
const migrate = require('../migrations')
const seed = require('../seeders')
const { bootstrap, getTennantConnection } = require('./connection')

const up = async (params) => {
  const job = new Queue(
    `setting-up-database-${new Date().getTime()}`,
    `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
  )
  job.add({ ...params })
  job.process(async (job, done) => {
    try {
      await db.raw(`CREATE ROLE ${params.tenantName} WITH LOGIN;`) // Postgres requires a role or user for each tenant
      await db.raw(
        `GRANT ${params.tenantName} TO ${process.env.POSTGRES_ROLE};`
      ) // you need provide permissions to your admin role in order to allow the database administration
      await db.raw(`CREATE DATABASE ${params.tenantName};`)
      await db.raw(
        `GRANT ALL PRIVILEGES ON DATABASE ${params.tenantName} TO ${params.tenantName};`
      )
      await bootstrap() // refresh tenant connections to include the new one as available
      const tenant = getTenantConnection(params.uuid)
      await migrate(tenant) // create all tables in the current tenant database
      await seed(tenant) // fill tables with dummy data
    } catch (e) {
      console.error(e)
    }
  })
}
```

- `tenant.js`: a controller used to handle the request to list, create or delete a tenant

```js
const { db } = require('../config/database')
const { v4: uuidv4 } = require('uuid')
const generator = require('generate-password')
const slugify = require('slugify')
const { down, up } = require('../services/tenant-service')

// index

const store = async (req, res) => {
  const {
    body: { organization }
  } = req

  const tenantName = slugify(organization.toLowerCase(), '_')
  const password = generator.generate({ length: 12, numbers: true })
  const uuid = uuidv4()
  const tenant = {
    uuid,
    db_name: tenantName,
    db_username: tenantName,
    db_password: password
  }
  await db('tenants').insert(tenant)
  await up({ tenantName, password, uuid })

  return res.formatter.ok({ tenant: { ...tenant } })
}

const destroy = async (req, res) => {
  const {
    params: { uuid }
  } = req

  const tenant = await db
    .select('db_name', 'db_username', 'uuid')
    .where('uuid', uuid)
    .from('tenants')

  await down({
    userName: tenant[0].db_username,
    tenantName: tenant[0].db_name,
    uuid: tenant[0].uuid
  })
  await db('tenants').where('uuid', uuid).del()

  return res.formatter.ok({ message: 'tenant was deleted successfully' })
}

module.exports = {
  // index,
  store,
  destroy
}
```

As you can see in the images below now the API is able to create multiple clients, sharing the services, endpoints and other stuffs but keeping isolated the databases.

![Client A](https://github.com/AgusRdz/multitenant_demo/blob/master/Screen%20Recording%202021-01-25%20at%2004.22.11%20p.m..gif)

![Client B](https://github.com/AgusRdz/multitenant_demo/blob/master/Screen%20Recording%202021-01-25%20at%2004.24.48%20p.m..gif)

![Querying](https://github.com/AgusRdz/multitenant_demo/blob/master/Screen%20Recording%202021-01-25%20at%2004.23.52%20p.m..gif)

![Querying](https://github.com/AgusRdz/multitenant_demo/blob/master/Screen%20Recording%202021-01-25%20at%2004.25.14%20p.m..gif)

### So cool!

Yup, multi-tenancy is not as complicated as it sounds, of course there are many things to consider such as infrastructure, CI/CD, best practices, software patterns, but just handle each one at a time and everything will be fine.
And as you can see, this architecture can help your business scale as high as you want because the _cloud_ is the limit, and the _cloud_ has not limits for now.

At ClickIt we can provide the entire set of tools and knowledge necessary to prepare your application and run it as a multi-tenant, so feel free to reach us anytime you need something regarding multi-tenancy.
