const https = require("https");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(bodyParser.json());
/*
const corsOptions = {
  origin: "http://localhost:8081",
};
app.use(cors(corsOptions));*/
app.use(cors());
const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none';"); // Zablokowanie osadzania w iframe
  next();
});

require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const SECRET_KEY = process.env.JWT_SECRET;

const storage = multer.memoryStorage(); // Przechowywanie zdjęć w pamięci
const upload = multer({ storage: storage });

//https.createServer(options, app).listen(5000, () => {
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

const loginLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, //3 minuty
  max: 3,
  message: {
    message: "Too many login attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordRegex =  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

app.post("/register", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).send("Login and password are required");
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).send({
      message:
        "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO bamusers (login, password) VALUES ($1, $2) RETURNING *",
      [login, hashedPassword]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, login: user.login }, SECRET_KEY, {
        expiresIn: "1h",
      });
      res.status(200).json({ message: "Register and Login successful", token });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/login", loginLimiter, async (req, res) => {
  const { login, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM bamusers WHERE login = $1", [
      login,
    ]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        const token = jwt.sign({ id: user.id, login: user.login }, SECRET_KEY, {
          expiresIn: "1h",
        });
        return res.status(200).json({ message: "Login successful", token });
      }
    }
    res.status(401).json({ message: "Invalid login or password" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/tasks", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { content, taskname } = req.body;
  console.log(userId, "userID");
  console.log(content, "content");
  if (!taskname || !content) {
    return res
      .status(400)
      .send({ message: "taskname and content are required" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO bamtasks (userid, taskname, content) VALUES ($1, $2, $3)",
      [userId, taskname, content]
    );
    res.status(201).send({ message: "task added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to add task" });
  }
});

app.get("/tasks", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      "SELECT bamtasks.* FROM bamtasks JOIN bamusers ON bamtasks.userId = bamusers.id WHERE bamusers.id = $1 ORDER BY bamtasks.createdAt DESC",
      [userId]
    );
    res.status(200).send(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch tasks" });
  }
});

app.get("/tasknames", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      "SELECT DISTINCT taskName FROM bamtasks WHERE userId = $1 ORDER BY taskName ASC",
      [userId]
    );
    res.status(200).send(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch task names" });
  }
});

app.get("/tasks/:taskname", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { taskname } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM bamtasks WHERE userId = $1 AND taskName = $2 ORDER BY createdAt DESC",
      [userId, taskname]
    );
    res.status(200).send(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch tasks for the category" });
  }
});

// Usuwanie zadania
app.delete("/tasks/:taskId", authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;
  try {
    // Usuwamy zadanie tylko wtedy, gdy należy ono do zalogowanego użytkownika
    const result = await pool.query(
      "DELETE FROM bamtasks WHERE id = $1 AND userId = $2 RETURNING *",
      [taskId, userId]
    );

    if (result.rows.length > 0) {
      res.status(200).send({ message: "Task deleted successfully" });
    } else {
      res.status(404).send({ message: "Task not found or unauthorized" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to delete task" });
  }
});

// Usuwanie taskname
app.delete("/tasknames/:taskname", authenticateToken, async (req, res) => {
  const { taskname } = req.params;
  const userId = req.user.id;
  try {
    // Usuwamy wszystkie zadania powiązane z danym taskname
    const result = await pool.query(
      "DELETE FROM bamtasks WHERE taskName = $1 AND userId = $2 RETURNING *",
      [taskname, userId]
    );

    if (result.rowCount > 0) {
      res
        .status(200)
        .send({ message: "Task name and its tasks deleted successfully" });
    } else {
      res.status(404).send({ message: "Task name not found or unauthorized" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to delete task name" });
  }
});

app.post(
  "/tasks/:taskname/photo",
  authenticateToken,
  upload.single("photo"), // obsługuje jedno zdjęcie
  async (req, res) => {
    const { taskname } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).send({ message: "Photo is required" });
    }

    try {
      // Zapisujemy zdjęcie w bazie danych (jako Buffer)
      const photoBuffer = req.file.buffer;

      // Przechowywanie zdjęcia w bazie danych
      await pool.query(
        "INSERT INTO bamphotos (taskName, userId, photo) VALUES ($1, $2, $3)",
        [taskname, userId, photoBuffer]
      );
      res.status(201).send({ message: "Photo uploaded successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Failed to upload photo" });
    }
  }
);

// Endpoint do pobierania zdjęć
app.get("/tasks/:taskname/photos", authenticateToken, async (req, res) => {
  const { taskname } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT id, photo, uploadedAt FROM bamphotos WHERE taskName = $1 AND userId = $2 ORDER BY uploadedAt DESC",
      [taskname, userId]
    );

    const photos = result.rows.map((row) => ({
      id: row.id,
      photo: row.photo.toString("base64"), // konwertowanie obrazu na base64
      uploadedAt: row.uploadedAt,
    }));

    res.status(200).send(photos);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to fetch photos" });
  }
});

/* Tabele...

CREATE TABLE bamusers (
    id SERIAL PRIMARY KEY,
    login VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE bamtasks (
    id SERIAL PRIMARY KEY,
    userId INT NOT NULL,
    taskName VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES bamusers(id) ON DELETE CASCADE
);

CREATE TABLE bamphotos (
    id SERIAL PRIMARY KEY,
    taskName VARCHAR(50) NOT NULL,
    userId INT NOT NULL,
    photo BYTEA NOT NULL, -- Typ przechowujący dane binarne
    uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES bamusers(id) ON DELETE CASCADE
);
*/
