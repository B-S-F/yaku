import EmbeddedPostgres from 'embedded-postgres'

export const pgOptions = {
  database_dir: './data',
  user: 'pguser',
  password: 'pgpw',
  port: 5433,
  persistent: false,
}

const db = new EmbeddedPostgres(pgOptions)

export async function setup() {
  await db.initialise()
  await db.start()
}

export async function teardown() {
  await db.stop()
}
