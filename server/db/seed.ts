import bcrypt from "bcryptjs";
import db from "./connection";

export function seedDatabase() {
  const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
  if (userCount.count > 0) return;

  const devPasswordHash = bcrypt.hashSync("123456", 10);

  db.prepare("INSERT INTO users (name, avatar, role, email, password_hash) VALUES (?, ?, ?, ?, ?)").run("Julio Carvalho", "https://api.dicebear.com/7.x/avataaars/svg?seed=Julio", "Arquiteto de Sistemas", "julio@stoa.com", devPasswordHash);
  db.prepare("INSERT INTO users (name, avatar, role, email, password_hash) VALUES (?, ?, ?, ?, ?)").run("Ana Silva", "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana", "Líder de Operações", "ana@stoa.com", devPasswordHash);

  db.prepare("INSERT INTO courses (title, description, thumbnail, lessons_count, progress) VALUES (?, ?, ?, ?, ?)").run(
    "Arquitetura de Sistemas Invisíveis",
    "Como construir a estrutura que faz sua empresa rodar sem você.",
    "https://picsum.photos/seed/system/800/450",
    24,
    45
  );

  const course1Id = 1;
  db.prepare('INSERT INTO modules (course_id, title, "order") VALUES (?, ?, ?)').run(course1Id, "Fundamentos da Arquitetura", 1);
  db.prepare('INSERT INTO modules (course_id, title, "order") VALUES (?, ?, ?)').run(course1Id, "Sistemas Invisíveis", 2);

  db.prepare('INSERT INTO lessons (module_id, title, content_url, content_type, duration, "order") VALUES (?, ?, ?, ?, ?, ?)').run(1, "Introdução ao Pensamento Sistêmico", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 300, 1);
  db.prepare('INSERT INTO lessons (module_id, title, content_url, content_type, duration, "order") VALUES (?, ?, ?, ?, ?, ?)').run(1, "A Anatomia de uma Organização Viva", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 450, 2);
  db.prepare('INSERT INTO lessons (module_id, title, content_url, content_type, duration, "order") VALUES (?, ?, ?, ?, ?, ?)').run(2, "O Segredo da Delegação de Autoridade", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 600, 1);
  db.prepare('INSERT INTO lessons (module_id, title, content_url, content_type, duration, "order") VALUES (?, ?, ?, ?, ?, ?)').run(2, "Mapeando Processos que não Engessam", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 520, 2);

  db.prepare("INSERT INTO courses (title, description, thumbnail, lessons_count, progress) VALUES (?, ?, ?, ?, ?)").run(
    "O Problema nunca é a Peça",
    "Identificando falhas estruturais antes que elas virem crises.",
    "https://picsum.photos/seed/architecture/800/450",
    18,
    10
  );

  const course2Id = 2;
  db.prepare('INSERT INTO modules (course_id, title, "order") VALUES (?, ?, ?)').run(course2Id, "Identificando o Problema", 1);
  db.prepare('INSERT INTO lessons (module_id, title, content_url, content_type, duration, "order") VALUES (?, ?, ?, ?, ?, ?)').run(3, "Por que as Peças Falham?", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 320, 1);
  db.prepare('INSERT INTO lessons (module_id, title, content_url, content_type, duration, "order") VALUES (?, ?, ?, ?, ?, ?)').run(3, "O Custo da Ineficiência Estrutural", "https://www.youtube.com/embed/dQw4w9WgXcQ", "video", 410, 2);

  db.prepare("INSERT INTO posts (user_id, content) VALUES (?, ?)").run(1, "O problema nunca é a peça. É o sistema. Se você precisa estar em toda decisão, você não tem uma empresa, tem um emprego de luxo.");

  // Seed conversations
  db.prepare("INSERT INTO conversations (id) VALUES (1)").run();
  db.prepare("INSERT INTO conversation_participants (conversation_id, user_id) VALUES (1, 1)").run();
  db.prepare("INSERT INTO conversation_participants (conversation_id, user_id) VALUES (1, 2)").run();
  db.prepare("INSERT INTO messages (conversation_id, sender_id, content) VALUES (1, 2, ?)").run("Ola Julio! Analisei a estrutura que voce propos para o novo modulo.");
  db.prepare("INSERT INTO messages (conversation_id, sender_id, content) VALUES (1, 1, ?)").run("Otimo! Vou ajustar os diagramas e te envio ainda hoje.");
  db.prepare("INSERT INTO messages (conversation_id, sender_id, content) VALUES (1, 2, ?)").run("Perfeito. O sistema deve ser invisivel, mas a autoridade deve ser sentida.");
}
