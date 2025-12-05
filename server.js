const express = require('express');
const cors = require('cors');
const mysql = require("mysql2");
const bcrypt = require('bcryptjs');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 22408,
  ssl: {
    ca:fs.readFileSync('./ca.pem')
  }
});

db.connect((err) => {
  if (err) {
    console.log("MySQL Connection Error:", err);
  } else {
    console.log("MySQL Connected Successfully");
  }
});

let users = [];


app.get('/', (req, res) => {
    res.json({ message: "backend working" });
});


app.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.json({ success: false, message: "All fields required" });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)";

  db.query(sql, [fullName, email, hashedPassword], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.json({ success: false, message: "Email already exists" });
      }
      return res.json({ success: false, message: "Database error" });
    }

    res.json({ success: true, message: "Signup successful" });
  });
});




app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, rows) => {
    if (err) return res.json({ success: false, message: "Database error" });

    if (rows.length === 0) {
      return res.json({ success: false, message: "Wrong email or password" });
    }

    const user = rows[0];
     const isMatch = await bcrypt.compare(password, user.password);

    if (user.password !== password) {
      return res.json({ success: false, message: "Wrong email or password" });
    }

    res.json({ success: true, message: "Login successful" });
  });
});




app.listen(5000, () => {
    console.log("backend running on http://localhost:5000");
});
