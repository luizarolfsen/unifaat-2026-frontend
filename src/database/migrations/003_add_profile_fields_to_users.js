// Campos de perfil para a API de busca (Elasticsearch): texto livre (job_title, bio),
// filtros exatos (city, state), intervalo de datas (birth_date) e booleano (is_active)
export async function up(db) {
  await db.query(`
    ALTER TABLE users
      ADD COLUMN job_title VARCHAR(100),
      ADD COLUMN bio TEXT,
      ADD COLUMN city VARCHAR(100),
      ADD COLUMN state CHAR(2),
      ADD COLUMN birth_date DATE,
      ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE
  `)
}

export async function down(db) {
  await db.query(`
    ALTER TABLE users
      DROP COLUMN job_title,
      DROP COLUMN bio,
      DROP COLUMN city,
      DROP COLUMN state,
      DROP COLUMN birth_date,
      DROP COLUMN is_active
  `)
}
