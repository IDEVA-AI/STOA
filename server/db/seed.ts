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

  // --- SaaS Multi-tenant seed data ---

  // 1. Default workspace
  db.prepare("INSERT INTO workspaces (name, slug, owner_id, plan) VALUES (?, ?, ?, ?)").run("STOA", "stoa", 1, "free");
  const workspaceId = 1;

  // 2. Workspace members for existing users
  db.prepare("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)").run(workspaceId, 1, "owner");
  db.prepare("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)").run(workspaceId, 2, "member");

  // 3. Update existing courses to belong to workspace
  db.prepare("UPDATE courses SET workspace_id = ? WHERE workspace_id IS NULL").run(workspaceId);

  // 4. Create default communities for each course
  const courses = db.prepare("SELECT id, title FROM courses").all() as Array<{ id: number; title: string }>;
  for (const course of courses) {
    db.prepare("INSERT INTO communities (workspace_id, course_id, name, description) VALUES (?, ?, ?, ?)").run(
      workspaceId,
      course.id,
      `${course.title} Community`,
      `Comunidade do curso ${course.title}`
    );
  }

  // 5. Create community categories for each community
  const communities = db.prepare("SELECT id FROM communities").all() as Array<{ id: number }>;
  const categoryNames = ["Discussões", "Dúvidas", "Resultados"];
  for (const community of communities) {
    for (let i = 0; i < categoryNames.length; i++) {
      db.prepare("INSERT INTO community_categories (community_id, name, position) VALUES (?, ?, ?)").run(community.id, categoryNames[i], i);
    }
  }

  // 6. Create default product for each course
  for (const course of courses) {
    db.prepare("INSERT INTO products (workspace_id, title, description, price, type, is_published) VALUES (?, ?, ?, ?, ?, ?)").run(
      workspaceId,
      course.title,
      `Acesso ao curso ${course.title}`,
      0,
      "course",
      1
    );
  }

  // 7. Link products to courses via product_courses
  const products = db.prepare("SELECT id, title FROM products").all() as Array<{ id: number; title: string }>;
  for (const product of products) {
    const matchingCourse = courses.find((c) => c.title === product.title);
    if (matchingCourse) {
      db.prepare("INSERT INTO product_courses (product_id, course_id) VALUES (?, ?)").run(product.id, matchingCourse.id);
    }
  }

  // 8. Update existing posts to belong to the first community
  if (communities.length > 0) {
    db.prepare("UPDATE posts SET community_id = ? WHERE community_id IS NULL").run(communities[0].id);
  }

  // 9. Seed default lesson templates
  seedLessonTemplates(workspaceId);
}

function seedLessonTemplates(workspaceId: number) {
  const count = db.prepare("SELECT count(*) as count FROM lesson_templates").get() as { count: number };
  if (count.count > 0) return;

  upsertDefaultTemplates(workspaceId);
}

/** Idempotent: inserts only templates whose name doesn't already exist for this workspace */
export function upsertDefaultTemplates(workspaceId: number) {
  const insertTemplate = db.prepare(
    "INSERT INTO lesson_templates (workspace_id, name, description, is_default) VALUES (?, ?, ?, ?)"
  );
  const insertBlock = db.prepare(
    "INSERT INTO lesson_template_blocks (template_id, block_type, content, position) VALUES (?, ?, ?, ?)"
  );
  const existingNames = (
    db.prepare("SELECT name FROM lesson_templates WHERE workspace_id = ?").all(workspaceId) as Array<{ name: string }>
  ).map((r) => r.name);

  const templates = getDefaultTemplateDefinitions();

  for (const tmpl of templates) {
    if (existingNames.includes(tmpl.name)) continue;
    const result = insertTemplate.run(workspaceId, tmpl.name, tmpl.description, 1);
    const templateId = Number(result.lastInsertRowid);
    for (let i = 0; i < tmpl.blocks.length; i++) {
      const b = tmpl.blocks[i];
      insertBlock.run(templateId, b.type, JSON.stringify(b.content), i);
    }
  }
}

function getDefaultTemplateDefinitions() {
  return [
    {
      name: "Aula Classica",
      description: "Video principal + texto explicativo + dica em destaque",
      blocks: [
        { type: "video", content: { url: "" } },
        { type: "text", content: { html: "<h2>Sobre esta aula</h2><p>Descreva o conteudo da aula, os objetivos de aprendizagem e o que o aluno vai dominar ao final.</p>" } },
        { type: "callout", content: { text: "Dica: anote os pontos principais enquanto assiste ao video!", type: "tip" } },
      ],
    },
    {
      name: "Aula com Material",
      description: "Video + texto + arquivo para download + botao de acao",
      blocks: [
        { type: "video", content: { url: "" } },
        { type: "text", content: { html: "<h2>Conteudo da Aula</h2><p>Explicacao detalhada do tema abordado no video.</p>" } },
        { type: "divider", content: {} },
        { type: "file", content: { url: "", filename: "Material complementar", size: "" } },
        { type: "button", content: { label: "Acessar recurso extra", url: "", style: "primary" } },
      ],
    },
    {
      name: "Conteudo Textual",
      description: "Artigo longo com imagem ilustrativa e destaque",
      blocks: [
        { type: "text", content: { html: "<h2>Introducao</h2><p>Contextualize o tema e apresente os objetivos deste conteudo.</p>" } },
        { type: "image", content: { url: "", caption: "Imagem ilustrativa" } },
        { type: "text", content: { html: "<h2>Desenvolvimento</h2><p>Aprofunde o tema com explicacoes, exemplos e referencias. Use subtitulos para organizar as secoes.</p>" } },
        { type: "callout", content: { text: "Ponto-chave: resuma aqui a informacao mais importante deste conteudo.", type: "info" } },
      ],
    },
    {
      name: "Landing / Vendas",
      description: "Pagina de apresentacao com imagem hero, texto persuasivo e CTA",
      blocks: [
        { type: "image", content: { url: "", caption: "" } },
        { type: "text", content: { html: "<h1>Titulo Impactante</h1><p>Apresente a proposta de valor de forma clara e direta. O que o aluno vai conquistar?</p>" } },
        { type: "divider", content: {} },
        { type: "text", content: { html: "<h2>O que voce vai aprender</h2><ul><li>Beneficio ou topico 1</li><li>Beneficio ou topico 2</li><li>Beneficio ou topico 3</li></ul>" } },
        { type: "button", content: { label: "Quero comecar agora", url: "", style: "primary" } },
        { type: "divider", content: {} },
        { type: "callout", content: { text: "Garantia: se nao gostar, devolvemos seu investimento em ate 7 dias.", type: "info" } },
      ],
    },
    {
      name: "Resumo Rapido",
      description: "Conteudo curto e direto com destaque e botao de acao",
      blocks: [
        { type: "callout", content: { text: "Resumo: os pontos essenciais deste modulo em poucas palavras.", type: "info" } },
        { type: "text", content: { html: "<p>Recapitule os conceitos mais importantes de forma objetiva. Ideal para revisao antes de provas ou proximos modulos.</p>" } },
        { type: "button", content: { label: "Proximo passo", url: "", style: "primary" } },
      ],
    },
  ];
}
