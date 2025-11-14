import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('Starting database initialization...');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by statements and execute each
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const connection = await pool.getConnection();
    
    for (const statement of statements) {
      if (statement) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await connection.query(statement);
      }
    }
    
    connection.release();
    
    console.log('✓ Database schema created successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    process.exit(1);
  }
}

initDatabase();

