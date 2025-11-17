/**
 * Test script to verify database tables and API functionality
 */

import db from '../src/config/database.js';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');

    // Test connection
    const connection = await db.getConnection();
    console.log('✅ Database connected');
    connection.release();

    // Test custom_articles table
    console.log('\n📚 Testing custom_articles table...');
    const [articles] = await db.execute('SELECT * FROM custom_articles LIMIT 5');
    console.log(`✅ Found ${articles.length} articles`);
    if (articles.length > 0) {
      console.log('Sample article:', {
        id: articles[0].id,
        title: articles[0].title,
        word_count: articles[0].word_count
      });
    }

    // Test word_translations table
    console.log('\n🔤 Testing word_translations table...');
    const [translations] = await db.execute('SELECT * FROM word_translations LIMIT 5');
    console.log(`✅ Found ${translations.length} cached translations`);
    if (translations.length > 0) {
      console.log('Sample translation:', translations[0]);
    }

    // Test user_vocabulary table
    console.log('\n📖 Testing user_vocabulary table...');
    const [vocabulary] = await db.execute('SELECT * FROM user_vocabulary LIMIT 5');
    console.log(`✅ Found ${vocabulary.length} vocabulary words`);
    if (vocabulary.length > 0) {
      console.log('Sample word:', vocabulary[0]);
    }

    console.log('\n✅ All database tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testDatabase();
