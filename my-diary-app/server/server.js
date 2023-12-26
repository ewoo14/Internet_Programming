const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Angelic1440!',
    database: 'diaryDB'
});

db.connect(err => {
    if (err) {
        throw err;
    }
    console.log('MySQL successfully connected!');
});

// 회원가입 라우트
app.post('/userregister', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)';
        db.query(query, [email, hashedPassword, name, phone], (err, results) => {
            if (err) throw err;
            res.status(200).send({ message: 'User registered successfully' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Server error' });
    }
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
            res.status(200).send({ message: 'Login successful', userId: results[0].id });
        } else {
            res.status(401).send({ message: 'Invalid credentials' });
        }
    });
});

// 사용자 이름 조회 라우트
app.get('/username', (req, res) => {
  const userId = req.query.userId;
  console.log(`Username request received for user ID: ${userId}`);
  if (!userId) {
    return res.status(400).send({ message: 'No user ID provided' });
  }

  db.query('SELECT name FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
        console.error(err);
        return res.status(500).send({ message: 'Server error' });
    }

    // 결과가 비어있는 경우 처리
    if (results.length === 0) {
        return res.status(404).send({ message: 'User not found' });
    }

    res.send({ name: results[0].name });
  });
});

// 일기저장 라우트
app.post('/savediary', async (req, res) => {
    try {
      const { user_id, date, content } = req.body;
      const query = 'INSERT INTO diaries (user_id, date, content) VALUES (?, ?, ?)';
      db.query(query, [user_id, date, content], (err, results) => {
        if (err) throw err;
        res.status(200).send({ message: 'Diary saved successfully' });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: 'Error saving diary' });
    }
  });

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
