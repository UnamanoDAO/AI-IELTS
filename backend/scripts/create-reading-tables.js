/**
 * Database migration script for custom reading comprehension feature
 * Creates tables for: custom_articles, word_translations, user_vocabulary
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ielts_vocabulary'
};

async function createTables() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // 1. Create custom_articles table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS custom_articles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL COMMENT 'Article title',
        content TEXT NOT NULL COMMENT 'Full article content',
        source VARCHAR(255) DEFAULT NULL COMMENT 'Article source/origin',
        difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate' COMMENT 'Reading difficulty level',
        word_count INT DEFAULT 0 COMMENT 'Total word count',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_difficulty (difficulty),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User-imported custom reading articles';
    `);
    console.log('✓ Created custom_articles table');

    // 2. Create word_translations table (cache for Aliyun translations)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS word_translations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        word VARCHAR(100) NOT NULL COMMENT 'English word (lowercase)',
        translation VARCHAR(255) NOT NULL COMMENT 'Chinese translation',
        phonetic VARCHAR(100) DEFAULT NULL COMMENT 'Phonetic notation',
        word_type VARCHAR(50) DEFAULT NULL COMMENT 'Part of speech (n., v., adj., etc.)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_word (word),
        INDEX idx_word (word)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Word translation cache';
    `);
    console.log('✓ Created word_translations table');

    // 3. Create user_vocabulary table (user's personal word book)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_vocabulary (
        id INT PRIMARY KEY AUTO_INCREMENT,
        word VARCHAR(100) NOT NULL COMMENT 'English word',
        translation VARCHAR(255) NOT NULL COMMENT 'Chinese translation',
        article_id INT DEFAULT NULL COMMENT 'Source article ID',
        context_sentence TEXT DEFAULT NULL COMMENT 'Sentence where word was encountered',
        mastery_level ENUM('new', 'learning', 'familiar', 'mastered') DEFAULT 'new' COMMENT 'Learning progress',
        review_count INT DEFAULT 0 COMMENT 'Number of times reviewed',
        last_reviewed_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Last review time',
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES custom_articles(id) ON DELETE SET NULL,
        INDEX idx_word (word),
        INDEX idx_article (article_id),
        INDEX idx_mastery (mastery_level),
        INDEX idx_added (added_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User personal vocabulary book';
    `);
    console.log('✓ Created user_vocabulary table');

    console.log('\n✅ All tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
createTables()
  .then(() => {
    console.log('\n🎉 Database migration completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
