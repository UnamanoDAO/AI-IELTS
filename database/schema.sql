-- Database schema for IELTS vocabulary application
-- Ensure UTF-8 encoding
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Drop existing tables to ensure schema is up to date
DROP TABLE IF EXISTS unit_words;
DROP TABLE IF EXISTS learning_units;
DROP TABLE IF EXISTS words;
DROP TABLE IF EXISTS categories;

-- Categories table: stores thematic groupings for vocabulary
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bundle_key VARCHAR(150) DEFAULT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) DEFAULT NULL,
  description TEXT,
  order_index INT DEFAULT 0,
  audio_filename VARCHAR(255) DEFAULT NULL,
  total_groups INT DEFAULT 0,
  total_words INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_name (name),
  UNIQUE KEY uq_categories_slug (slug),
  UNIQUE KEY uq_categories_bundle_key (bundle_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Words table: main vocabulary storage
CREATE TABLE IF NOT EXISTS words (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT DEFAULT NULL,
  word VARCHAR(200) NOT NULL,
  base_form VARCHAR(200) DEFAULT NULL,
  variants TEXT,
  phonetic VARCHAR(200),
  part_of_speech VARCHAR(100),
  chinese_meaning TEXT NOT NULL,
  word_root TEXT,
  example_sentence TEXT,
  example_translation TEXT,
  audio_url VARCHAR(500),
  example_audio_url VARCHAR(500),
  memory_tip TEXT,
  difficulty_level INT DEFAULT 1,
  order_in_category INT DEFAULT 0,
  source_extra TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_words_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_words_category (category_id),
  INDEX idx_words_word (word),
  INDEX idx_words_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning units: weekly study batches with category linkage
CREATE TABLE IF NOT EXISTS learning_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT DEFAULT NULL,
  unit_name VARCHAR(200) NOT NULL,
  unit_code VARCHAR(120) DEFAULT NULL,
  unit_number INT NOT NULL,
  order_in_category INT NOT NULL,
  description TEXT,
  estimated_days INT DEFAULT 7,
  total_words INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_learning_units_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY uq_learning_units_code (unit_code),
  INDEX idx_learning_units_category_order (category_id, order_in_category),
  INDEX idx_learning_units_number (unit_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Junction table linking words to units
CREATE TABLE IF NOT EXISTS unit_words (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unit_id INT NOT NULL,
  word_id INT NOT NULL,
  order_in_unit INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_unit_words_unit
    FOREIGN KEY (unit_id) REFERENCES learning_units(id) ON DELETE CASCADE,
  CONSTRAINT fk_unit_words_word
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  INDEX idx_unit_words_unit (unit_id),
  INDEX idx_unit_words_word (word_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reading articles for each learning unit
CREATE TABLE IF NOT EXISTS unit_readings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unit_id INT NOT NULL,
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_unit_readings_unit
    FOREIGN KEY (unit_id) REFERENCES learning_units(id) ON DELETE CASCADE,
  INDEX idx_unit_readings_unit (unit_id),
  INDEX idx_unit_readings_order (unit_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sentences with translations for reading articles
CREATE TABLE IF NOT EXISTS reading_sentences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reading_id INT NOT NULL,
  sentence_text TEXT NOT NULL,
  translation TEXT NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reading_sentences_reading
    FOREIGN KEY (reading_id) REFERENCES unit_readings(id) ON DELETE CASCADE,
  INDEX idx_reading_sentences_reading (reading_id),
  INDEX idx_reading_sentences_order (reading_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


