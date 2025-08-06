
-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 班级表
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    teacher_id TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users (id)
);

-- 3. 学生列表表
CREATE TABLE IF NOT EXISTS class_students (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    user_id TEXT,
    joined_at DATETIME,
    is_removed INTEGER DEFAULT 0,
    removed_at DATETIME,
    removed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (removed_by) REFERENCES users (id)
);

-- 4. 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT '课程任务',
    needs_file INTEGER DEFAULT 0,
    allow_aigc INTEGER DEFAULT 1,
    require_aigc_log INTEGER DEFAULT 0,
    deadline DATETIME NOT NULL,
    allow_late_submission INTEGER DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_archived INTEGER DEFAULT 0,
    archived_at DATETIME,
    archived_by TEXT,
    allow_student_view_when_archived INTEGER DEFAULT 1,
    is_deleted INTEGER DEFAULT 0,
    deleted_at DATETIME,
    deleted_by TEXT,
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (archived_by) REFERENCES users (id),
    FOREIGN KEY (deleted_by) REFERENCES users (id)
);

-- 5. 任务-班级关联表
CREATE TABLE IF NOT EXISTS task_classes (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    UNIQUE(task_id, class_id)
);

-- 6. 提交记录表
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    content TEXT DEFAULT '',
    file_key TEXT,
    file_name TEXT,
    aigc_log_key TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_late_submission INTEGER DEFAULT 0,
    late_minutes INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks (id),
    FOREIGN KEY (student_id) REFERENCES users (id),
    UNIQUE(task_id, student_id)
);

-- 7. 提交图片表
CREATE TABLE IF NOT EXISTS submission_images (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    image_key TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE
);

-- 8. 班级编辑历史表
CREATE TABLE IF NOT EXISTS class_edit_history (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    edited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    edited_by TEXT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes (id),
    FOREIGN KEY (edited_by) REFERENCES users (id)
);

-- 9. 任务操作历史表
CREATE TABLE IF NOT EXISTS task_operation_history (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks (id),
    FOREIGN KEY (performed_by) REFERENCES users (id)
);

-- 10. 反馈表
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    user_id TEXT,
    user_email TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_user_id ON class_students(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_task_classes_task_id ON task_classes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_classes_class_id ON task_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submission_images_submission_id ON submission_images(submission_id);

-- 插入测试数据
-- 测试用户（密码都是 test123 的bcrypt哈希）
INSERT OR IGNORE INTO users (id, email, password, role) VALUES 
('test-teacher-1', 'teacher@test.com', '$2b$10$rH8PjLcDeI4w8qKxUxGcYeUqA.B5X5rLOjQX5pWzGq8.wvU8Y5yKC', 'teacher'),
('test-student-1', 'student@test.com', '$2b$10$rH8PjLcDeI4w8qKxUxGcYeUqA.B5X5rLOjQX5pWzGq8.wvU8Y5yKC', 'student');