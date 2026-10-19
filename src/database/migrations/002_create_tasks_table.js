export async function up(db) {
  await db.query(`
    CREATE TABLE tasks (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      is_done BOOLEAN DEFAULT FALSE,
      id_user INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
}

export async function down(db) {
  await db.query(`
    DROP TABLE tasks
  `)
}
