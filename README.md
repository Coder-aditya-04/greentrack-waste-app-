# GreenTrack (MySQL Edition)

GreenTrack is now a full-stack web app using:
- Frontend: HTML, CSS, Bootstrap 5, Vanilla JavaScript
- Backend: Node.js + Express
- Database: MySQL

## 1) Prerequisites

- Node.js 18+
- MySQL Server running locally or on your network

## 2) Configuration

1. Copy environment template to .env
2. Update DB credentials if needed

Example .env values:

PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=greentrack

## 3) Install and run

npm install
npm start

On startup, the server automatically:
- Creates database if missing
- Creates tables if missing
- Seeds demo zones, groups, users, logs, and issue reports

## 4) Test in browser

Open:
http://localhost:3000

Demo logins:
- ananya@campus.edu / greentrack123
- rohan@campus.edu / greentrack123

## 5) API overview

- POST /api/auth/signup
- POST /api/auth/login
- GET /api/meta
- GET /api/cleaning-logs
- POST /api/cleaning-logs
- GET /api/issues
- POST /api/issues

## 6) Optional SQL file

schema.sql is provided if you prefer manual setup.
