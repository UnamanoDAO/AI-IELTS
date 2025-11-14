import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('Starting migration: Add user authentication and vocabulary book...');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../../database/migrations/001_add_user_and_vocabulary_book.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    // Remove comments and split by semicolons
    const statements = migration
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const connection = await pool.getConnection();

    for (const statement of statements) {
      if (statement && statement.toLowerCase().includes('create table')) {
        const tableName = statement.match(/CREATE TABLE.*?`?(\w+)`?/i)?.[1];
        console.log(`Creating table: ${tableName}...`);
        await connection.query(statement);
        console.log(`✓ Table ${tableName} created`);
      } else if (statement) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await connection.query(statement);
      }
    }

    connection.release();

    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration();
