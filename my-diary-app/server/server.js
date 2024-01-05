require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// 타임스탬프 함수
const moment = require('moment-timezone');
function getCurrentTimestamp() {
    return moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
}

// 로그를 기록하는 함수
function logAction(email, message) {
    console.log(`[${getCurrentTimestamp()}] [${email}] ${message}`);
}

// 5자리 랜덤 숫자 생성 함수
function generateRandomUserId() {
  return Math.floor(10000 + Math.random() * 90000);
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

// 이메일 서비스 설정
const transporter = nodemailer.createTransport({
  service: 'Naver',
  host: 'smtp.naver.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.NAVER_USER,
    pass: process.env.NAVER_PASS
  },
  tls: {
    rejectUnauthorized: false,
    // TLSv1.2
    secureProtocol: 'TLSv1_2_method'
  }
});

// 이메일 인증 토큰 생성 함수
function generateEmailVerificationToken() {
  return crypto.randomBytes(20).toString('hex');
}

// 이메일 발송 함수
async function sendVerificationEmail(email, emailVerificationToken, tokenExpirationTime) {
  const formattedExpirationTime = tokenExpirationTime.format('YYYY-MM-DD HH:mm:ss');
  const verificationLink = `http://localhost:8080/verify-email?token=${emailVerificationToken}`;
  const mailOptions = {
    from: 'ewoo2821@naver.com',
    to: email,
    subject: '이메일 인증',
    html: `<p>이메일 인증을 위해 아래 링크를 클릭해주세요. 해당 링크는 <strong>${formattedExpirationTime}</strong>까지 유효합니다.\n\n<a href="${verificationLink}">이메일 인증</a></p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logAction(email, `Verification email sent: ${info.response}`);
  } catch (error) {
    console.log("이메일 사용자:", process.env.EMAIL_USER);
    console.log("이메일 비밀번호:", process.env.EMAIL_PASS);
    console.error(`Error sending verification email to ${email}: ${error.message}`);
    throw new Error('Error sending verification email');
  }
}

// 만료된 계정 삭제 함수
function deleteExpiredAccounts() {
  const query = `
    DELETE FROM users 
    WHERE email_verified = 0 AND 
    token_expiration < NOW()`;

  db.query(query, (err, results) => {
    if (err) {
      console.error(`Error deleting expired accounts: ${err.message}`);
    } else {
      console.log(`Deleted expired accounts: ${results.affectedRows}`);
    }
  });
}

// 데이터베이스 연결 설정
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Angelic1440!'
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

      if (result.warningCount === 0) {
          console.log("DiaryDB created!");
      } else {
          console.log("Database already exists!");
      }

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
              phone VARCHAR(20) NOT NULL,
              email_verified BOOLEAN NOT NULL DEFAULT FALSE,
              email_verification_token VARCHAR(255),
              token_expiration DATETIME
          )`;

          db.query(createUsersTable, (err, result) => {
              if (err) throw err;

              if (result.warningCount === 0) {
                  console.log("Table 'users' created!");
              } else {
                  console.log("Table 'users' already exists!");
              }

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

                  if (result.warningCount === 0) {
                      console.log("Table 'diaries' created!");
                  } else {
                      console.log("Table 'diaries' already exists!");
                  }
              });
          });
          deleteExpiredAccounts();
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
      // 고유 사용자 ID 생성
      let userId;
      let isUnique = false;
      while (!isUnique) {
        userId = generateRandomUserId();
        const checkUserId = await db.promise().query('SELECT id FROM users WHERE id = ?', [userId]);
        if (checkUserId[0].length === 0) {
          isUnique = true;
        }
      }
  
      // 요청으로부터 사용자 정보 추출
      const { email, password, name, phone } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // 이메일 인증 토큰 생성
      const emailVerificationToken = generateEmailVerificationToken();
      const currentTimestamp = getCurrentTimestamp();
      const tokenExpirationTime = moment(currentTimestamp).add(3, 'hours');
  
      // 사용자 정보 저장
      const insertQuery = 'INSERT INTO users (id, email, password, name, phone, email_verification_token, token_expiration) VALUES (?, ?, ?, ?, ?, ?, ?)';
      db.query(insertQuery, [userId, email, hashedPassword, name, phone, emailVerificationToken, tokenExpirationTime.format('YYYY-MM-DD HH:mm:ss')], async (err, results) => {
        if (err) {
          logAction(email, `Error in registering account: ${err.message}`);
          return res.status(500).send({ message: 'Error in registering account' });
        }
        logAction(email, `Account registered with ID ${userId}`);
  
        // 이메일 발송 로직 호출
        try {
          const tokenExpirationTime = moment().add(3, 'hours');
          await sendVerificationEmail(email, emailVerificationToken, tokenExpirationTime);
          res.status(200).send({ message: 'Verification email sent successfully' });
        } catch (error) {
          res.status(500).send({ message: error.message });
        }
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

      // 사용자가 존재하지 않거나 비밀번호가 일치하지 않는 경우
      if (!results.length || !await bcrypt.compare(password, results[0].password)) {
        logAction(email, 'Login error');
        return res.status(401).send({ message: '잘못된 이메일 또는 비밀번호입니다.' });
      }

      // 이메일 인증 여부 확인
      if (!results[0].email_verified) {
        logAction(email, 'Email not verified');
        return res.status(401).send({ message: '이메일 인증이 완료되지 않았습니다.' });
      }

      // 로그인 성공
      logAction(email, 'Login successful');
      res.status(200).send({ message: 'Login successful', userId: results[0].id });
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

  // 계정 찾기 라우트
  app.post('/findAccount', (req, res) => {
    const { name, phone } = req.body;

    db.query('SELECT email FROM users WHERE name = ? AND phone = ?', [name, phone], (err, results) => {
      if (err) {
        logAction(name, `FindAccount request error: ${err.message}`);
        return res.status(500).send({ message: 'Server error' });
      }

      if (results.length > 0) {
        const email = results[0].email;
        logAction(name, `FindAccount request: Account found with email ${email}`);
        res.send({ email: email });
      } else {
        logAction(name, 'FindAccount request: No account found');
        res.status(404).send({ message: 'No account found' });
      }
    });
  });

  // 비밀번호 재설정 라우트
  app.post('/resetPassword', (req, res) => {
    const { email, name, phone } = req.body;

    db.query('SELECT id FROM users WHERE email = ? AND name = ? AND phone = ?', [email, name, phone], (err, results) => {
      if (err) {
        logAction(email, `ResetPassword request error: ${err.message}`);
        return res.status(500).send({ message: 'Server error' });
      }

      if (results.length > 0) {
        const userId = results[0].id;
        logAction(email, `ResetPassword request: User found with ID ${userId}`);
        res.send({ userId: userId });
      } else {
        logAction(email, 'ResetPassword request: No user found');
        res.status(404).send({ message: 'No user found' });
      }
    });
  });

  // 비밀번호 업데이트 라우트
  app.post('/updatePassword', async (req, res) => {
    const { userId, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (err, results) => {
      if (err) {
        logAction(userId, `UpdatePassword request error: ${err.message}`);
        return res.status(500).send({ message: 'Server error' });
      }

      logAction(userId, `UpdatePassword request: Password updated successfully`);
      res.send({ message: 'Password updated successfully' });
    });
  });

  // 사용자 정보 조회 라우트
  app.get('/userinfo/:userId', (req, res) => {
    const userId = req.params.userId;

    db.query('SELECT email, name, phone FROM users WHERE id = ?', [userId], (err, results) => {
      if (err) {
        logAction(userId, `Userinfo request error: ${err.message}`);
        return res.status(500).send({ message: 'Server error' });
      }

      if (results.length > 0) {
        const userInfo = results[0];
        logAction(userId, `Userinfo request: User information retrieved`);
        res.send(userInfo);
      } else {
        logAction(userId, 'Userinfo request: User not found');
        res.status(404).send({ message: 'User not found' });
      }
    });
  });

  // 서버 시작
  app.listen(3000, () => {
      console.log('Server is running on port 3000');
  });
}

// 서버 초기화 실행
initializeServer();

// 주기적으로 만료된 비인증 계정 삭제(매 10분)
setInterval(deleteExpiredAccounts, 600000);