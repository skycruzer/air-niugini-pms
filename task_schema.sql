### 2.2 Task Management Schema

```sql
-- Task lists/boards
CREATE TABLE task_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#E4002B', -- Hex color for UI
    icon VARCHAR(50) DEFAULT 'clipboard', -- Lucide icon name
    list_type VARCHAR(20) DEFAULT 'standard', -- standard, smart, shared

    -- Smart list criteria (for filtered views)
    smart_criteria JSONB, -- {"assignee": 1, "priority": "high", "due": "this_week"}

    -- Permissions
    owner_id INTEGER REFERENCES an_users(id),
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with INTEGER[], -- Array of user IDs

    -- UI State
    sort_order INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Main tasks table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID REFERENCES task_lists(id) ON DELETE CASCADE,

    -- Task Details
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled

    -- Assignment
    assignee_id INTEGER REFERENCES an_users(id),
    created_by INTEGER REFERENCES an_users(id),

    -- Dates
    due_date DATE,
    due_time TIME,
    reminder_date TIMESTAMP,
    completed_at TIMESTAMP,

    -- Related Entities
    pilot_id INTEGER REFERENCES pilots(id), -- Optional link to pilot
    incident_id UUID REFERENCES disciplinary_incidents(id), -- Optional link to incident
    check_id INTEGER REFERENCES pilot_checks(id), -- Optional link to certification

    -- Categorization
    tags TEXT[], -- Array of tags
    category VARCHAR(50), -- operations, safety, training, administrative

    -- Progress Tracking
    progress INTEGER DEFAULT 0, -- 0-100 percentage
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),

    -- UI State
    sort_order INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Collaboration
    watchers INTEGER[], -- Array of user IDs watching this task
    last_activity_at TIMESTAMP DEFAULT NOW(),
    last_activity_by INTEGER REFERENCES an_users(id),

    -- Optimistic UI
    version INTEGER DEFAULT 1,
    client_id VARCHAR(100), -- For optimistic update tracking

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subtasks
CREATE TABLE task_subtasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    completed_by INTEGER REFERENCES an_users(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Task comments
CREATE TABLE task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_by INTEGER REFERENCES an_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    mentioned_users INTEGER[],
    attachments JSONB -- Array of attachment objects
);

-- Task attachments
CREATE TABLE task_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES an_users(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Activity log for tasks
CREATE TABLE task_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- created, updated, completed, assigned, commented
    description TEXT,
    performed_by INTEGER REFERENCES an_users(id),
    performed_at TIMESTAMP DEFAULT NOW(),
    details JSONB -- Additional activity details
);

-- Real-time presence tracking
CREATE TABLE user_presence (
    user_id INTEGER REFERENCES an_users(id) PRIMARY KEY,
    current_page VARCHAR(100),
    current_entity_type VARCHAR(50), -- task, incident, pilot
    current_entity_id VARCHAR(100),
    cursor_position JSONB, -- {x: 100, y: 200} for collaborative cursors
    is_typing BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_list ON tasks(list_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_subtasks_task ON task_subtasks(task_id);
CREATE INDEX idx_task_activity_task ON task_activity_log(task_id);
CREATE INDEX idx_presence_entity ON user_presence(current_entity_type, current_entity_id);

-- Database Views for optimized queries
CREATE VIEW task_summary_view AS
SELECT
    t.*,
    tl.name as list_name,
    tl.color as list_color,
    u1.name as assignee_name,
    u2.name as creator_name,
    COUNT(DISTINCT ts.id) as subtask_count,
    COUNT(DISTINCT ts.id) FILTER (WHERE ts.is_completed) as completed_subtask_count,
    COUNT(DISTINCT tc.id) as comment_count,
    COUNT(DISTINCT ta.id) as attachment_count
FROM tasks t
LEFT JOIN task_lists tl ON t.list_id = tl.id
LEFT JOIN an_users u1 ON t.assignee_id = u1.id
LEFT JOIN an_users u2 ON t.created_by = u2.id
LEFT JOIN task_subtasks ts ON t.id = ts.task_id
LEFT JOIN task_comments tc ON t.id = tc.task_id
LEFT JOIN task_attachments ta ON t.id = ta.task_id
GROUP BY t.id, tl.name, tl.color, u1.name, u2.name;
````

---

## 3. Row Level Security (RLS) Policies
