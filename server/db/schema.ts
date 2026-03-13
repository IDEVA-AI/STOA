import db from "./connection";

export function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      avatar TEXT,
      role TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
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

    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversation_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      user_id INTEGER,
      last_read_at TEXT,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(conversation_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      sender_id INTEGER,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id),
      FOREIGN KEY(sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      priority INTEGER NOT NULL DEFAULT 0,
      frequency TEXT NOT NULL DEFAULT 'once',
      target TEXT NOT NULL DEFAULT 'all',
      is_active INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcement_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      announcement_id INTEGER NOT NULL,
      block_type TEXT NOT NULL,
      content TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcement_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      announcement_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      confirmed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(announcement_id, user_id),
      FOREIGN KEY (announcement_id) REFERENCES announcements(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      owner_id INTEGER NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(workspace_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'course',
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS product_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(product_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      workspace_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      purchased_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS trails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      thumbnail TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS trails_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trail_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(trail_id) REFERENCES trails(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(trail_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS communities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      course_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id),
      FOREIGN KEY(course_id) REFERENCES courses(id)
    );

    CREATE TABLE IF NOT EXISTS community_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(community_id) REFERENCES communities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS courses_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      module_id INTEGER NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE CASCADE,
      UNIQUE(course_id, module_id)
    );

    CREATE TABLE IF NOT EXISTS modules_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
      UNIQUE(module_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS lesson_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      block_type TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '{}',
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lesson_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      thumbnail TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS lesson_template_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      block_type TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '{}',
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(template_id) REFERENCES lesson_templates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invite_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      workspace_id INTEGER NOT NULL,
      product_id INTEGER,
      created_by INTEGER NOT NULL,
      max_uses INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id),
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS invite_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invite_code_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      redeemed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(invite_code_id) REFERENCES invite_codes(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(invite_code_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS availability_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT 'Tutoria Individual',
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      buffer_minutes INTEGER NOT NULL DEFAULT 15,
      max_advance_days INTEGER NOT NULL DEFAULT 30,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
    );

    CREATE TABLE IF NOT EXISTS availability_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      FOREIGN KEY(config_id) REFERENCES availability_configs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      meet_link TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(config_id) REFERENCES availability_configs(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(follower_id) REFERENCES users(id),
      FOREIGN KEY(following_id) REFERENCES users(id),
      UNIQUE(follower_id, following_id)
    );
  `);

  // Safely add new columns to existing users table (SQLite has no IF NOT EXISTS for ALTER TABLE)
  const columnsToAdd = [
    { name: "email", definition: "TEXT UNIQUE" },
    { name: "password_hash", definition: "TEXT" },
    { name: "created_at", definition: "TEXT DEFAULT CURRENT_TIMESTAMP" },
    { name: "is_active", definition: "INTEGER DEFAULT 1" },
    { name: "bio", definition: "TEXT" },
    { name: "phone", definition: "TEXT" },
    { name: "website", definition: "TEXT" },
    { name: "is_public", definition: "INTEGER DEFAULT 1" },
    { name: "show_progress", definition: "INTEGER DEFAULT 1" },
  ];

  const coursesColumnsToAdd = [
    { name: "workspace_id", definition: "INTEGER" },
    { name: "is_published", definition: "INTEGER DEFAULT 1" },
  ];

  const postsColumnsToAdd = [
    { name: "community_id", definition: "INTEGER" },
    { name: "category_id", definition: "INTEGER" },
    { name: "is_pinned", definition: "INTEGER DEFAULT 0" },
  ];

  for (const col of columnsToAdd) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.definition}`);
    } catch (_) {
      // Column already exists — ignore
    }
  }

  for (const col of coursesColumnsToAdd) {
    try {
      db.exec(`ALTER TABLE courses ADD COLUMN ${col.name} ${col.definition}`);
    } catch (_) {
      // Column already exists — ignore
    }
  }

  for (const col of postsColumnsToAdd) {
    try {
      db.exec(`ALTER TABLE posts ADD COLUMN ${col.name} ${col.definition}`);
    } catch (_) {
      // Column already exists — ignore
    }
  }

  // Performance indices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
    CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
    CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
    CREATE INDEX IF NOT EXISTS idx_announcement_blocks_announcement_id ON announcement_blocks(announcement_id);
    CREATE INDEX IF NOT EXISTS idx_announcement_confirmations_announcement_id ON announcement_confirmations(announcement_id);
    CREATE INDEX IF NOT EXISTS idx_announcement_confirmations_user_id ON announcement_confirmations(user_id);
    CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_products_workspace_id ON products(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_product_courses_product_id ON product_courses(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_courses_course_id ON product_courses(course_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_workspace_id ON purchases(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
    CREATE INDEX IF NOT EXISTS idx_trails_workspace_id ON trails(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_trails_courses_trail_id ON trails_courses(trail_id);
    CREATE INDEX IF NOT EXISTS idx_trails_courses_course_id ON trails_courses(course_id);
    CREATE INDEX IF NOT EXISTS idx_communities_workspace_id ON communities(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_communities_course_id ON communities(course_id);
    CREATE INDEX IF NOT EXISTS idx_community_categories_community_id ON community_categories(community_id);
    CREATE INDEX IF NOT EXISTS idx_courses_modules_course_id ON courses_modules(course_id);
    CREATE INDEX IF NOT EXISTS idx_courses_modules_module_id ON courses_modules(module_id);
    CREATE INDEX IF NOT EXISTS idx_modules_lessons_module_id ON modules_lessons(module_id);
    CREATE INDEX IF NOT EXISTS idx_modules_lessons_lesson_id ON modules_lessons(lesson_id);
    CREATE INDEX IF NOT EXISTS idx_courses_workspace_id ON courses(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_blocks_lesson_id ON lesson_blocks(lesson_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_templates_workspace_id ON lesson_templates(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_template_blocks_template_id ON lesson_template_blocks(template_id);
    CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
    CREATE INDEX IF NOT EXISTS idx_invite_codes_workspace_id ON invite_codes(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON invite_codes(status);
    CREATE INDEX IF NOT EXISTS idx_invite_redemptions_invite_code_id ON invite_redemptions(invite_code_id);
    CREATE INDEX IF NOT EXISTS idx_invite_redemptions_user_id ON invite_redemptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_availability_configs_workspace_id ON availability_configs(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_availability_slots_config_id ON availability_slots(config_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_config_id ON bookings(config_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
  `);

  // Migrate existing relationships to junction tables
  migrateDataRelationships();
}

function migrateDataRelationships() {
  // Populate courses_modules from existing modules.course_id
  const modules = db.prepare("SELECT id, course_id, \"order\" FROM modules WHERE course_id IS NOT NULL").all() as Array<{ id: number; course_id: number; order: number }>;
  for (const mod of modules) {
    try {
      db.prepare("INSERT OR IGNORE INTO courses_modules (course_id, module_id, position) VALUES (?, ?, ?)").run(mod.course_id, mod.id, mod.order ?? 0);
    } catch (_) {
      // Already migrated — ignore
    }
  }

  // Populate modules_lessons from existing lessons.module_id
  const lessons = db.prepare("SELECT id, module_id, \"order\" FROM lessons WHERE module_id IS NOT NULL").all() as Array<{ id: number; module_id: number; order: number }>;
  for (const lesson of lessons) {
    try {
      db.prepare("INSERT OR IGNORE INTO modules_lessons (module_id, lesson_id, position) VALUES (?, ?, ?)").run(lesson.module_id, lesson.id, lesson.order ?? 0);
    } catch (_) {
      // Already migrated — ignore
    }
  }
}
