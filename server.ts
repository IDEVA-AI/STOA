import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("nexus.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    avatar TEXT,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    thumbnail TEXT,
    lessons_count INTEGER,
    progress INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    title TEXT,
    "order" INTEGER,
    FOREIGN KEY(course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER,
    title TEXT,
    content_url TEXT,
    content_type TEXT,
    duration INTEGER,
    "order" INTEGER,
    FOREIGN KEY(module_id) REFERENCES modules(id)
  );

  CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    lesson_id INTEGER,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(lesson_id) REFERENCES lessons(id),
    UNIQUE(user_id, lesson_id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (name, avatar, role) VALUES (?, ?, ?)").run("Julio Carvalho", "https://api.dicebear.com/7.x/avataaars/svg?seed=Julio", "Arquiteto de Sistemas");
  db.prepare("INSERT INTO users (name, avatar, role) VALUES (?, ?, ?)").run("Ana Silva", "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana", "Líder de Operações");
  
  db.prepare("INSERT INTO courses (title, description, thumbnail, lessons_count, progress) VALUES (?, ?, ?, ?, ?)").run(
    "Arquitetura de Sistemas Invisíveis", 
    "Como construir a estrutura que faz sua empresa rodar sem você.",
    "https://picsum.photos/seed/system/800/450",
    24,
    45
  );

  const course1Id = 1;
  db.prepare("INSERT INTO modules (course_id, title, \"order\") VALUES (?, ?, ?)").run(course1Id, "Fundamentos da Arquitetura", 1);
  db.prepare("INSERT INTO modules (course_id, title, \"order\") VALUES (?, ?, ?)").run(course1Id, "Sistemas Invisíveis", 2);
  
  db.prepare("INSERT INTO lessons (module_id, title, content_url, content_type, duration, \"order\") VALUES (?, ?, ?, ?, ?, ?)").run(1, "Introdução ao Pensamento Sistêmico", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 300, 1);
  db.prepare("INSERT INTO lessons (module_id, title, content_url, content_type, duration, \"order\") VALUES (?, ?, ?, ?, ?, ?)").run(1, "A Anatomia de uma Organização Viva", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 450, 2);
  db.prepare("INSERT INTO lessons (module_id, title, content_url, content_type, duration, \"order\") VALUES (?, ?, ?, ?, ?, ?)").run(2, "O Segredo da Delegação de Autoridade", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 600, 1);
  db.prepare("INSERT INTO lessons (module_id, title, content_url, content_type, duration, \"order\") VALUES (?, ?, ?, ?, ?, ?)").run(2, "Mapeando Processos que não Engessam", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 520, 2);

  db.prepare("INSERT INTO courses (title, description, thumbnail, lessons_count, progress) VALUES (?, ?, ?, ?, ?)").run(
    "O Problema nunca é a Peça", 
    "Identificando falhas estruturais antes que elas virem crises.",
    "https://picsum.photos/seed/architecture/800/450",
    18,
    10
  );

  const course2Id = 2;
  db.prepare("INSERT INTO modules (course_id, title, \"order\") VALUES (?, ?, ?)").run(course2Id, "Identificando o Problema", 1);
  db.prepare("INSERT INTO lessons (module_id, title, content_url, content_type, duration, \"order\") VALUES (?, ?, ?, ?, ?, ?)").run(3, "Por que as Peças Falham?", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 320, 1);
  db.prepare("INSERT INTO lessons (module_id, title, content_url, content_type, duration, \"order\") VALUES (?, ?, ?, ?, ?, ?)").run(3, "O Custo da Ineficiência Estrutural", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 410, 2);

  db.prepare("INSERT INTO posts (user_id, content) VALUES (?, ?)").run(1, "O problema nunca é a peça. É o sistema. Se você precisa estar em toda decisão, você não tem uma empresa, tem um emprego de luxo.");
}

async function startServer() {
  const app = express();
  const PORT = 4747;

  app.use(express.json());

  // API Routes
  app.get("/api/courses", (req, res) => {
    const courses = db.prepare("SELECT * FROM courses").all();
    res.json(courses);
  });

  app.get("/api/courses/:id/content", (req, res) => {
    const id = Number(req.params.id);
    console.log(`Fetching content for course ID: ${id}`);
    try {
      const modules = db.prepare("SELECT * FROM modules WHERE course_id = ? ORDER BY \"order\" ASC").all(id) as any[];
      console.log(`Found ${modules.length} modules for course ${id}`);
      
      for (const mod of modules) {
        mod.lessons = db.prepare("SELECT * FROM lessons WHERE module_id = ? ORDER BY \"order\" ASC").all(mod.id);
        console.log(`Module ${mod.id} has ${mod.lessons.length} lessons`);
      }
      
      res.json(modules);
    } catch (error) {
      console.error(`Error fetching course content for ${id}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/feed", (req, res) => {
    const posts = db.prepare(`
      SELECT posts.*, users.name as user_name, users.avatar as user_avatar 
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      ORDER BY created_at DESC
    `).all();
    res.json(posts);
  });

  app.post("/api/posts", (req, res) => {
    const { content, userId } = req.body;
    const result = db.prepare("INSERT INTO posts (user_id, content) VALUES (?, ?)").run(userId || 1, content);
    res.json({ id: result.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
