const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const crypto = require('crypto');

// 타임스탬프 함수
const moment = require('moment-timezone');
function getCurrentTimestamp() {
    return moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
}

// 로그를 기록하는 함수
function logAction(email, message) {
    console.log(`[${getCurrentTimestamp()}] [${email}] ${message}`);
}

// 암호화 키
const ENCRYPTION_KEY = 'your-32-byte-long-encryption-key'; // 32바이트의 키
const IV_LENGTH = 16; // 초기화 벡터 길이

// 텍스트 암호화 함수
function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// 텍스트 복호화 함수
function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// 데이터베이스 연결 설정
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '8027'
};

// MySQL 데이터베이스 연결
const db = mysql.createConnection(dbConfig);

// 서버 초기화 및 데이터베이스 설정
function initializeServer() {
  // 데이터베이스 연결
  db.connect(err => {
      if (err) {
          throw err;
      }
      console.log('MySQL successfully connected!');

      // diaryDB 데이터베이스 생성
      db.query("CREATE DATABASE IF NOT EXISTS diaryDB", (err, result) => {
          if (err) throw err;
          console.log("Database created or already exists");

          // diaryDB 사용 설정
          db.changeUser({database: 'diaryDB'}, (err) => {
              if (err) throw err;

              // users 테이블 생성
              const createUsersTable = `
                  CREATE TABLE IF NOT EXISTS users (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      email VARCHAR(255) NOT NULL UNIQUE,
                      password VARCHAR(255) NOT NULL,
                      name VARCHAR(100) NOT NULL,
                      phone VARCHAR(20) NOT NULL
                  )`;
              db.query(createUsersTable, (err, result) => {
                  if (err) throw err;
                  console.log("Users table created or already exists");

                  // diaries 테이블 생성
                  const createDiariesTable = `
                      CREATE TABLE IF NOT EXISTS diaries (
                          diary_id INT AUTO_INCREMENT PRIMARY KEY,
                          user_id INT,
                          date DATE,
                          content TEXT,
                          FOREIGN KEY (user_id) REFERENCES users(id)
                      )`;
                  db.query(createDiariesTable, (err, result) => {
                      if (err) throw err;
                      console.log("Diaries table created or already exists");
                  });
              });
          });
      });
  });

  // Express 앱 설정
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // 회원가입 라우트
  app.post('/userregister', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)';
        db.query(query, [email, hashedPassword, name, phone], (err, results) => {
            if (err) {
                logAction(email, `Error in registering account: ${err.message}`);
                throw err;
            }
            logAction(email, `Account registered`);
            res.status(200).send({ message: 'User registered successfully' });
        });
    } catch (err) {
        logAction(email, `Server error on registering: ${err.message}`);
        res.status(500).send({ message: 'Server error' });
    }
  });

  // 이메일 중복 확인 라우트
  app.get('/check-email/:email', (req, res) => {
    const emailToCheck = req.params.email;
  
    db.query('SELECT * FROM users WHERE email = ?', [emailToCheck], (err, results) => {
      if (err) {
        logAction(email, `Server error on searching email in database: ${err.message}`);
        return res.status(500).send({ message: 'Server error' });
      }
  
      if (results.length > 0) {
        // 중복 이메일이 이미 존재하는 경우
        logAction(emailToCheck, 'Email already exists');
        return res.status(409).send({ message: '이미 존재하는 메일입니다.' });
      }
  
      // 중복 이메일이 존재하지 않는 경우
      logAction(emailToCheck, 'Email available');
      res.status(200).send({ message: '사용 가능한 이메일입니다.' });
    });
  });

  // 로그인 라우트
  app.post('/userlogin', (req, res) => {
    const { email, password } = req.body;

    // 사용자 이메일로 데이터베이스 조회
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ message: 'Server error' });
        }

        // 사용자가 존재하고 비밀번호가 일치하는지 확인
        if (results.length && await bcrypt.compare(password, results[0].password)) {
            logAction(email, 'Login successful');
            res.status(200).send({ message: 'Login successful', userId: results[0].id });
        } else {
            logAction(email, 'Login error');
            res.status(401).send({ message: 'Login error' });
        }
    });
  });

  // 사용자 이름 조회 라우트
  app.get('/username', (req, res) => {
    const userId = req.query.userId;
    logAction(userId, `Username request received: ${userId}`);
    if (!userId) {
      logAction(userId, `Username request error: No user ID provided`);
      return res.status(400).send({ message: 'No user ID provided' });
    }
  
    db.query('SELECT name FROM users WHERE id = ?', [userId], (err, results) => {
      if (err) {
          logAction(userId, `Username request error: ${err.message}`);
          return res.status(500).send({ message: 'Server error' });
      }
  
      // 결과가 비어있는 경우 처리
      if (results.length === 0) {
          logAction(userId, `Username request error: User not found`);
          return res.status(404).send({ message: 'User not found' });
      }
  
      res.send({ name: results[0].name });
    });
  });

  // 일기저장 라우트
  app.post('/savediary', (req, res) => {
    const { user_id, date, content } = req.body;
    const encryptedContent = encrypt(content);
  
    // 선택 날짜에 일기가 있는지 확인
    db.query('SELECT * FROM diaries WHERE user_id = ? AND date = ?', [user_id, date], (selectErr, selectResults) => {
      if (selectErr) {
        logAction(user_id, `Savediary request error: ${selectErr.message}`);
        return res.status(500).send({ message: 'Error checking for diary' });
      }
  
      if (selectResults.length > 0) {
        // 일기가 이미 존재하면 업데이트
        const updateQuery = 'UPDATE diaries SET content = ? WHERE user_id = ? AND date = ?';
        db.query(updateQuery, [encryptedContent, user_id, date], (updateErr, updateResults) => {
          if (updateErr) {
            logAction(user_id, `SaveDiary request error: ${updateErr.message}`);
            return res.status(500).send({ message: 'Error updating diary' });
          }
          logAction(user_id, `SaveDiary request: Diary updated successfully`);
          res.status(200).send({ message: 'Diary updated successfully' });
        });
      } else {

        // 새 일기 삽입
        const insertQuery = 'INSERT INTO diaries (user_id, date, content) VALUES (?, ?, ?)';
        db.query(insertQuery, [user_id, date, encryptedContent], (insertErr, insertResults) => {
          if (insertErr) {
            logAction(user_id, `SaveDiary request error: ${insertErr.message}`);
            return res.status(500).send({ message: 'Error saving diary' });
          }
          logAction(user_id, `SaveDiary request: Diary saved successfully`);
          res.status(200).send({ message: 'Diary saved successfully' });
        });
      }
    });
  });

  // 특정 날짜의 일기 조회 라우트
  app.get('/diary/:date', (req, res) => {
    const userId = req.query.userId;
    const date = req.params.date;
  
    if (!userId || !date) {
        logAction(user_id, `SearchDiary request error: User ID or Date not provided`);
        return res.status(400).send({ message: 'User ID or Date not provided' });
    }
  
    // 데이터베이스에서 해당 날짜와 사용자 ID로 일기 조회
    db.query('SELECT * FROM diaries WHERE user_id = ? AND date = ?', [userId, date], (err, results) => {
      if (err) {
        logAction(userId, `SearchDiary request error: ${err.message}`);
        return res.status(500).send({ message: 'Server error' });
      }
      
      
      // 해당 날짜의 일기가 존재하지 않는 경우
      if (results.length === 0) {
        
        logAction(userId, `SearchDiary request: no contents on this date`);
        return res.status(404).send({ message: 'Diary not found for this date' });
      }
      
  
      // 조회된 일기 반환
      const decryptedContent = decrypt(results[0].content);
    res.send({ content: decryptedContent });
    });
  });

  // 서버 시작
  app.listen(3000, () => {
      console.log('Server is running on port 3000');
  });
}

// 서버 초기화 실행
initializeServer();