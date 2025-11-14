import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Database Configuration
DB_HOST=rm-2ze58tvrta52qmyz1lo.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=zhizhijuan
DB_PASSWORD=Xj196210*
DB_NAME=english

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5174
`;

const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  console.log('.env file already exists');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✓ Created .env file successfully');
}