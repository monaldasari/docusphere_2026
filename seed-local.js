const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await client.connect();
    
    // Create admin user
    const passwordHash = await bcrypt.hash("admin123", 10);
    const adminEmail = "admin@test.io";
    const name = "Admin User";
    const role = "admin";
    const id = "admin-user-uuid-1111";
    
    await client.query(`
      INSERT INTO users (id, email, password_hash, name, role, streak, last_visit, updated_at)
      VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $3, name = $4, role = $5
    `, [id, adminEmail, passwordHash, name, role]);
    
    // Create standard user
    const standardPasswordHash = await bcrypt.hash("password123", 10);
    const standardEmail = "user@test.io";
    const standardName = "Demo User";
    const standardId = "user-uuid-2222";
    
    await client.query(`
      INSERT INTO users (id, email, password_hash, name, role, streak, last_visit, updated_at)
      VALUES ($1, $2, $3, $4, $5, 12, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $3, name = $4
    `, [standardId, standardEmail, standardPasswordHash, standardName, "user"]);
    
    console.log("Database seeded successfully via pg client! ✅");
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
