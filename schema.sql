CREATE DATABASE IF NOT EXISTS greentrack;
USE greentrack;

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'bis_member') NOT NULL,
  group_name VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cleaning_logs (
  log_id VARCHAR(64) PRIMARY KEY,
  zone_id VARCHAR(10) NOT NULL,
  group_name VARCHAR(100) NOT NULL,
  before_image_data LONGTEXT NOT NULL,
  after_image_data LONGTEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issue_reports (
  report_id VARCHAR(64) PRIMARY KEY,
  zone_id VARCHAR(10) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('Pending', 'Resolved') NOT NULL DEFAULT 'Pending',
  image_data LONGTEXT NULL,
  timestamp DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zones (
  zone_id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS bis_groups (
  group_name VARCHAR(100) PRIMARY KEY
);
