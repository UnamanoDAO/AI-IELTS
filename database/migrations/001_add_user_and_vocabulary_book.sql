-- Migration: Add user authentication and vocabulary book tables
-- Date: 2025-01-14

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Users table: stores user authentication data
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User vocabulary book: stores user's difficult words with AI analysis
CREATE TABLE IF NOT EXISTS user_vocabulary_book (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  word VARCHAR(200) NOT NULL,
  phonetic VARCHAR(200),
  pronunciation_audio_url VARCHAR(500),
  chinese_meaning TEXT,
  word_breakdown TEXT COMMENT 'AI analysis of word structure/roots for memory',
  memory_technique TEXT COMMENT 'AI-generated memory tips',
  derived_words TEXT COMMENT 'Related words, derivatives, comma-separated',
  common_usage TEXT COMMENT 'Common usage scenarios',
  usage_examples JSON COMMENT 'Array of {sentence: string, translation: string, audio_url: string}',
  is_mastered BOOLEAN DEFAULT FALSE COMMENT 'User marked as mastered',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  mastered_at TIMESTAMP NULL,
  CONSTRAINT fk_vocabulary_book_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vocabulary_book_user (user_id),
  INDEX idx_vocabulary_book_word (word),
  INDEX idx_vocabulary_book_mastered (user_id, is_mastered),
  UNIQUE KEY uq_user_word (user_id, word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Test results: stores matching game test results
CREATE TABLE IF NOT EXISTS vocabulary_test_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_questions INT NOT NULL,
  correct_count INT NOT NULL,
  test_duration_seconds INT,
  words_tested JSON COMMENT 'Array of word IDs from user_vocabulary_book',
  CONSTRAINT fk_test_results_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_test_results_user (user_id),
  INDEX idx_test_results_date (user_id, test_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
