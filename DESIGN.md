# Premium UX-First System Architecture

## Air Niugini Pilot Management System - New Modules

**Version**: 1.0.0
**Date**: October 2025
**Modules**: Disciplinary Matters & Task Management
**Architecture Type**: Premium UX-First with Real-Time Collaboration

---

## 1. System Overview

### 1.1 High-Level Architecture

The system introduces two sophisticated modules with enterprise-grade UX, real-time collaboration, and aviation-compliant workflows:

1. **Pilot Disciplinary Matters Module**: Secure, workflow-driven HR management with complete audit trails
2. **Task Management Module**: Collaborative task system with multiple views and real-time updates

### 1.2 Key Objectives

- **Sub-100ms Interactions**: Instant feedback on all user actions
- **Real-Time Collaboration**: Live updates across all connected clients
- **Zero Data Loss**: Auto-save, conflict resolution, and offline support
- **Aviation Compliance**: FAA/CASA regulatory requirements
- **Enterprise Security**: Role-based access with complete audit trails

### 1.3 System Context Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Air Niugini PMS Frontend                  │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14.2.33 + React 18.3.1 + TypeScript 5.9.2         │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Disciplinary    │  │ Task Management │                  │
│  │ Matters Module  │  │    Module       │                  │
│  └─────────────────┘  └─────────────────┘                  │
│           │                    │                            │
│  ┌────────────────────────────────────────┐                │
│  │     Shared Premium UX Layer            │                │
│  │  - Optimistic Updates                  │                │
│  │  - Real-time Subscriptions             │                │
│  │  - Offline Queue                       │                │
│  │  - Animation Engine                    │                │
│  └────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL + Row Level Security + Real-time + Edge Functions│
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Disciplinary    │  │ Tasks & Lists   │                  │
│  │ Tables & Views  │  │ Tables & Views  │                  │
│  └─────────────────┘  └─────────────────┘                  │
│  ┌────────────────────────────────────────┐                │
│  │     Real-time Broadcasting             │                │
│  │  - Presence Channels                   │                │
│  │  - Change Notifications                │                │
│  │  - Collaborative Cursors               │                │
│  └────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

### 2.1 Disciplinary Matters Schema

````sql
-- Main disciplinary incidents table
CREATE TABLE disciplinary_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_number VARCHAR(50) UNIQUE NOT NULL, -- Format: DM-2025-001
    pilot_id INTEGER REFERENCES pilots(id) ON DELETE RESTRICT,

    -- Incident Details
    incident_date DATE NOT NULL,
    incident_type VARCHAR(50) NOT NULL, -- violation, misconduct, performance, safety
    severity VARCHAR(20) NOT NULL, -- minor, moderate, serious, critical
    category VARCHAR(50) NOT NULL, -- operational, administrative, behavioral, regulatory

    -- Description and Evidence
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(100),
    flight_number VARCHAR(20),
    aircraft_registration VARCHAR(20),

    -- Workflow Status
    status VARCHAR(50) NOT NULL DEFAULT 'reported', -- reported, investigating, review, disciplinary_action, appealing, closed, dismissed
    current_stage VARCHAR(50) NOT NULL DEFAULT 'initial_report',
    assigned_investigator_id INTEGER REFERENCES an_users(id),
    assigned_reviewer_id INTEGER REFERENCES an_users(id),

    -- Outcomes
    investigation_findings TEXT,
    disciplinary_action VARCHAR(100), -- warning, suspension, training, termination
    action_details TEXT,
    appeal_status VARCHAR(50), -- not_appealed, pending, upheld, overturned
    appeal_notes TEXT,

    -- Important Dates
    investigation_started_at TIMESTAMP,
    investigation_completed_at TIMESTAMP,
    review_started_at TIMESTAMP,
    review_completed_at TIMESTAMP,
    action_taken_at TIMESTAMP,
    appeal_filed_at TIMESTAMP,
    appeal_decided_at TIMESTAMP,
    closed_at TIMESTAMP,

    -- Metadata
    created_by INTEGER REFERENCES an_users(id),
    updated_by INTEGER REFERENCES an_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Optimistic UI Support
    version INTEGER DEFAULT 1,
    locked_by INTEGER REFERENCES an_users(id),
    locked_at TIMESTAMP,

    -- Soft Delete
    deleted_at TIMESTAMP,
    deleted_by INTEGER REFERENCES an_users(id)
);

-- Workflow stages tracking
CREATE TABLE disciplinary_workflow_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES disciplinary_incidents(id) ON DELETE CASCADE,
    stage_name VARCHAR(50) NOT NULL,
    stage_status VARCHAR(20) NOT NULL, -- pending, in_progress, completed, skipped
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by INTEGER REFERENCES an_users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Documents and attachments
CREATE TABLE disciplinary_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES disciplinary_incidents(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- evidence, report, statement, decision, appeal
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES an_users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_confidential BOOLEAN DEFAULT TRUE,
    description TEXT
);

-- Comments and notes
CREATE TABLE disciplinary_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES disciplinary_incidents(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal notes not visible to pilot
    created_by INTEGER REFERENCES an_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    parent_comment_id UUID REFERENCES disciplinary_comments(id), -- For threading
    mentioned_users INTEGER[] -- Array of user IDs mentioned
);

-- Audit log for compliance
CREATE TABLE disciplinary_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES disciplinary_incidents(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    performed_by INTEGER REFERENCES an_users(id),
    performed_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Indexes for performance
CREATE INDEX idx_disciplinary_pilot ON disciplinary_incidents(pilot_id);
CREATE INDEX idx_disciplinary_status ON disciplinary_incidents(status);
CREATE INDEX idx_disciplinary_date ON disciplinary_incidents(incident_date DESC);
CREATE INDEX idx_disciplinary_severity ON disciplinary_incidents(severity);
CREATE INDEX idx_workflow_incident ON disciplinary_workflow_stages(incident_id);
CREATE INDEX idx_comments_incident ON disciplinary_comments(incident_id);
CREATE INDEX idx_audit_incident ON disciplinary_audit_log(incident_id);

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

### 3.1 Disciplinary Matters RLS

```sql
-- Enable RLS on all tables
ALTER TABLE disciplinary_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_audit_log ENABLE ROW LEVEL SECURITY;

-- Disciplinary Incidents Policies
-- Admin: Full access
CREATE POLICY "admin_all_incidents" ON disciplinary_incidents
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Manager: Read all, write assigned
CREATE POLICY "manager_read_incidents" ON disciplinary_incidents
    FOR SELECT USING (auth.jwt() ->> 'role' = 'manager');

CREATE POLICY "manager_write_assigned" ON disciplinary_incidents
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'manager'
        AND (assigned_investigator_id = auth.uid()::INTEGER
             OR assigned_reviewer_id = auth.uid()::INTEGER)
    );

-- Pilot: Read own incidents only (with restrictions)
CREATE POLICY "pilot_read_own" ON disciplinary_incidents
    FOR SELECT USING (
        pilot_id = auth.uid()::INTEGER
        AND status NOT IN ('reported', 'investigating') -- Can't see until review stage
    );

-- Workflow Stages - Follow incident permissions
CREATE POLICY "workflow_follows_incident" ON disciplinary_workflow_stages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM disciplinary_incidents di
            WHERE di.id = incident_id
            AND (
                auth.jwt() ->> 'role' = 'admin'
                OR (auth.jwt() ->> 'role' = 'manager' AND di.assigned_investigator_id = auth.uid()::INTEGER)
            )
        )
    );

-- Documents - Restricted access
CREATE POLICY "documents_admin_manager" ON disciplinary_documents
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Comments - Internal visibility control
CREATE POLICY "comments_visibility" ON disciplinary_comments
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
        OR (NOT is_internal AND pilot_id = auth.uid()::INTEGER)
    );

-- Audit log - Read only for admin
CREATE POLICY "audit_admin_only" ON disciplinary_audit_log
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

### 3.2 Task Management RLS

```sql
-- Enable RLS on all task tables
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Task Lists Policies
-- Users can see: own lists + shared lists
CREATE POLICY "lists_visibility" ON task_lists
    FOR SELECT USING (
        owner_id = auth.uid()::INTEGER
        OR auth.uid()::INTEGER = ANY(shared_with)
        OR auth.jwt() ->> 'role' = 'admin'
    );

-- Users can modify own lists
CREATE POLICY "lists_modify_own" ON task_lists
    FOR ALL USING (owner_id = auth.uid()::INTEGER);

-- Tasks Policies
-- View tasks in accessible lists
CREATE POLICY "tasks_in_accessible_lists" ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM task_lists tl
            WHERE tl.id = list_id
            AND (tl.owner_id = auth.uid()::INTEGER
                 OR auth.uid()::INTEGER = ANY(tl.shared_with)
                 OR auth.jwt() ->> 'role' = 'admin')
        )
    );

-- Modify tasks: assignee, creator, or list owner
CREATE POLICY "tasks_modify" ON tasks
    FOR ALL USING (
        assignee_id = auth.uid()::INTEGER
        OR created_by = auth.uid()::INTEGER
        OR EXISTS (
            SELECT 1 FROM task_lists tl
            WHERE tl.id = list_id AND tl.owner_id = auth.uid()::INTEGER
        )
        OR auth.jwt() ->> 'role' = 'admin'
    );

-- Subtasks follow parent task permissions
CREATE POLICY "subtasks_follow_parent" ON task_subtasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_id
            AND (t.assignee_id = auth.uid()::INTEGER
                 OR t.created_by = auth.uid()::INTEGER)
        )
    );

-- Comments visible to task participants
CREATE POLICY "comments_task_participants" ON task_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_id
            AND (t.assignee_id = auth.uid()::INTEGER
                 OR t.created_by = auth.uid()::INTEGER
                 OR auth.uid()::INTEGER = ANY(t.watchers))
        )
    );

-- User presence - all authenticated users
CREATE POLICY "presence_authenticated" ON user_presence
    FOR ALL USING (auth.role() = 'authenticated');
```

---

## 4. API Endpoints / Edge Functions

### 4.1 Disciplinary Matters APIs

```typescript
// Edge Function: /functions/disciplinary/create
interface CreateIncidentRequest {
  pilotId: number;
  incidentDate: string;
  incidentType: 'violation' | 'misconduct' | 'performance' | 'safety';
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  category: string;
  title: string;
  description: string;
  location?: string;
  flightNumber?: string;
  aircraftRegistration?: string;
}

interface CreateIncidentResponse {
  success: boolean;
  data: DisciplinaryIncident;
  workflowId: string;
}

// Edge Function: /functions/disciplinary/workflow/advance
interface AdvanceWorkflowRequest {
  incidentId: string;
  action: 'investigate' | 'review' | 'take_action' | 'close' | 'dismiss';
  notes?: string;
  findings?: string;
  disciplinaryAction?: string;
  actionDetails?: string;
}

// Edge Function: /functions/disciplinary/search
interface SearchIncidentsRequest {
  pilotId?: number;
  status?: string[];
  severity?: string[];
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

// Service Layer Functions
export const disciplinaryService = {
  // Create new incident with workflow initialization
  async createIncident(data: CreateIncidentRequest): Promise<CreateIncidentResponse> {
    const incidentNumber = await generateIncidentNumber(); // DM-2025-001

    // Transaction: Create incident + initialize workflow + audit log
    const { data: incident, error } = await supabase.rpc('create_incident_with_workflow', {
      incident_data: { ...data, incident_number: incidentNumber },
      initial_workflow_stages: ['initial_report', 'investigation', 'review', 'decision', 'closure'],
    });

    // Trigger real-time notification
    await supabase.channel('disciplinary-updates').send({
      type: 'broadcast',
      event: 'incident_created',
      payload: incident,
    });

    return { success: true, data: incident, workflowId: incident.workflow_id };
  },

  // Real-time subscription for incident updates
  subscribeToIncident(incidentId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`incident-${incidentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'disciplinary_incidents',
          filter: `id=eq.${incidentId}`,
        },
        callback
      )
      .subscribe();
  },
};
```

### 4.2 Task Management APIs

```typescript
// Edge Function: /functions/tasks/batch-operations
interface BatchTaskOperation {
  operation: 'create' | 'update' | 'delete' | 'complete';
  taskIds?: string[];
  data?: Partial<Task>;
}

interface BatchTaskResponse {
  success: boolean;
  processed: number;
  failed: string[];
  results: Task[];
}

// Edge Function: /functions/tasks/smart-suggestions
interface SmartSuggestionsRequest {
  context: 'pilot' | 'incident' | 'certification';
  entityId: string | number;
}

interface SmartSuggestionsResponse {
  suggestedTasks: Array<{
    title: string;
    description: string;
    priority: string;
    dueDate: string;
    reason: string;
  }>;
}

// Service Layer with Optimistic Updates
export const taskService = {
  // Optimistic task creation
  async createTaskOptimistic(task: CreateTaskRequest): Promise<Task> {
    const clientId = generateClientId();
    const optimisticTask = {
      ...task,
      id: clientId,
      status: 'pending',
      created_at: new Date().toISOString(),
      version: 0,
    };

    // Update local cache immediately
    queryClient.setQueryData(['tasks'], (old: Task[]) => [...old, optimisticTask]);

    // Persist to database
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, client_id: clientId })
      .select()
      .single();

    if (error) {
      // Rollback optimistic update
      queryClient.setQueryData(['tasks'], (old: Task[]) => old.filter((t) => t.id !== clientId));
      throw error;
    }

    // Replace optimistic task with real one
    queryClient.setQueryData(['tasks'], (old: Task[]) =>
      old.map((t) => (t.id === clientId ? data : t))
    );

    return data;
  },

  // Real-time collaboration
  setupRealtimeCollaboration(taskId: string) {
    const channel = supabase.channel(`task-${taskId}-presence`);

    // Track presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      updateCollaboratorCursors(state);
    });

    // Track typing indicators
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      showUserJoined(newPresences[0]);
    });

    // Subscribe to task changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `id=eq.${taskId}`,
      },
      (payload) => {
        handleRealtimeTaskUpdate(payload);
      }
    );

    // Join with user metadata
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: currentUser.id,
          user_name: currentUser.name,
          cursor: { x: 0, y: 0 },
          is_typing: false,
        });
      }
    });

    return channel;
  },
};
```

---

## 5. Premium UX Architecture

### 5.1 Micro-Interactions Design

```typescript
// Framer Motion animation variants
export const microInteractions = {
  // Button press with haptic feedback simulation
  buttonPress: {
    scale: [1, 0.95, 1.05, 1],
    transition: {
      duration: 0.2,
      times: [0, 0.4, 0.6, 1],
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },

  // Card hover with elevation
  cardHover: {
    y: -4,
    scale: 1.02,
    boxShadow: '0 10px 30px rgba(228, 0, 43, 0.2)',
    transition: { duration: 0.2, ease: 'easeOut' }
  },

  // Success checkmark animation
  successCheck: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: { duration: 0.4, ease: 'easeOut' }
  },

  // Stagger children for lists
  staggerContainer: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  },

  // List item entrance
  listItem: {
    hidden: { x: -20, opacity: 0 },
    show: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  }
};

// Interaction feedback component
export function InteractionFeedback({ children, type = 'button' }: InteractionFeedbackProps) {
  const [isInteracting, setIsInteracting] = useState(false);

  return (
    <motion.div
      variants={microInteractions[type]}
      animate={isInteracting ? 'active' : 'idle'}
      onMouseDown={() => setIsInteracting(true)}
      onMouseUp={() => setIsInteracting(false)}
      onMouseLeave={() => setIsInteracting(false)}
      whileHover="hover"
      whileTap="tap"
    >
      {children}
      {/* Ripple effect */}
      <AnimatePresence>
        {isInteracting && (
          <motion.span
            className="absolute inset-0 rounded-lg bg-white/20"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

### 5.2 Loading States Strategy

```typescript
// Skeleton loading with progressive enhancement
export function TaskCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 p-4">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Skeleton structure */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// Progressive content reveal
export function ProgressiveList({ items, isLoading }: ProgressiveListProps) {
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    if (!isLoading && items.length > visibleCount) {
      const timer = setInterval(() => {
        setVisibleCount(prev => Math.min(prev + 5, items.length));
      }, 100);

      return () => clearInterval(timer);
    }
  }, [isLoading, items.length, visibleCount]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={microInteractions.staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-2"
    >
      {items.slice(0, visibleCount).map((item, index) => (
        <motion.div
          key={item.id}
          variants={microInteractions.listItem}
          layout
          layoutId={item.id}
        >
          <TaskCard task={item} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 5.3 Error Recovery Flows

```typescript
// Smart error boundary with recovery options
export class SmartErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null, errorInfo: null };

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    logger.error('Component Error', { error, errorInfo });

    // Check if recoverable
    const isRecoverable = this.checkRecoverable(error);

    this.setState({
      hasError: true,
      error,
      errorInfo,
      isRecoverable
    });
  }

  checkRecoverable(error: Error): boolean {
    // Network errors are recoverable
    if (error.message.includes('network')) return true;
    // Supabase errors might be recoverable
    if (error.message.includes('supabase')) return true;
    // Syntax errors are not recoverable
    if (error.name === 'SyntaxError') return false;

    return true;
  }

  handleRecovery = async () => {
    if (this.state.isRecoverable) {
      // Clear error state
      this.setState({ hasError: false, error: null });

      // Retry failed operations
      await queryClient.invalidateQueries();

      // Show success feedback
      toast.success('Successfully recovered! Your data has been refreshed.');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[400px] items-center justify-center p-8"
        >
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
            <p className="mt-2 text-gray-600">
              {this.state.isRecoverable
                ? "We've encountered a temporary issue. You can try to recover."
                : "We've encountered an unexpected error. Please refresh the page."}
            </p>

            <div className="mt-6 flex gap-3 justify-center">
              {this.state.isRecoverable && (
                <Button onClick={this.handleRecovery} variant="primary">
                  Try Recovery
                </Button>
              )}
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left text-xs">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
```

### 5.4 Empty States and Onboarding

```typescript
// Intelligent empty states with contextual actions
export function SmartEmptyState({ type, context }: SmartEmptyStateProps) {
  const { user } = useAuth();
  const router = useRouter();

  const emptyStateConfigs = {
    tasks: {
      illustration: <TasksIllustration />,
      title: "No tasks yet",
      description: "Start organizing your work by creating your first task",
      actions: [
        {
          label: "Create Task",
          onClick: () => openTaskModal(),
          icon: <Plus className="h-4 w-4" />
        },
        {
          label: "Import from Template",
          onClick: () => openTemplateGallery(),
          variant: "outline"
        }
      ]
    },
    disciplinary: {
      illustration: <ShieldCheck className="h-24 w-24 text-gray-300" />,
      title: "No incidents recorded",
      description: "This is good news! No disciplinary matters to display.",
      actions: user.role === 'admin' ? [
        {
          label: "View Guidelines",
          onClick: () => router.push('/dashboard/guidelines'),
          variant: "outline"
        }
      ] : []
    },
    search: {
      illustration: <Search className="h-24 w-24 text-gray-300" />,
      title: "No results found",
      description: `We couldn't find anything matching "${context.searchTerm}"`,
      actions: [
        {
          label: "Clear Search",
          onClick: context.onClear,
          variant: "outline"
        },
        {
          label: "Search Tips",
          onClick: () => setShowSearchTips(true),
          variant: "ghost"
        }
      ]
    }
  };

  const config = emptyStateConfigs[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className="text-center max-w-sm">
        {config.illustration}
        <h3 className="mt-6 text-lg font-semibold text-gray-900">
          {config.title}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          {config.description}
        </p>

        {config.actions.length > 0 && (
          <div className="mt-6 flex gap-3 justify-center">
            {config.actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || 'primary'}
                size="sm"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Onboarding tour with progress tracking
export function OnboardingTour({ features }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    {
      target: '.task-create-button',
      content: 'Create your first task by clicking here',
      placement: 'bottom' as const
    },
    {
      target: '.task-list',
      content: 'Your tasks will appear here. Drag to reorder them.',
      placement: 'right' as const
    },
    {
      target: '.filter-menu',
      content: 'Use filters to organize and find tasks quickly',
      placement: 'left' as const
    }
  ];

  return (
    <Joyride
      steps={steps}
      continuous
      showProgress
      showSkipButton
      run={!isComplete}
      stepIndex={currentStep}
      styles={{
        options: {
          primaryColor: '#E4002B',
          textColor: '#000',
          backgroundColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000
        },
        spotlight: {
          borderRadius: 8
        }
      }}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: {
            filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.1))'
          }
        }
      }}
      callback={(data) => {
        if (data.action === 'reset' || data.action === 'close') {
          setIsComplete(true);
          localStorage.setItem('onboarding_complete', 'true');
        }
        if (data.action === 'next') {
          setCurrentStep(data.index + 1);
        }
      }}
    />
  );
}
```

---

## 6. Real-Time Collaboration

### 6.1 Supabase Realtime Integration

```typescript
// Real-time collaboration manager
export class CollaborationManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private presenceState: Map<string, PresenceState> = new Map();

  async joinCollaboration(entityType: string, entityId: string) {
    const channelName = `${entityType}-${entityId}`;

    // Create or get channel
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: this.currentUser.id }
        }
      });

      this.setupChannelHandlers(channel, entityType, entityId);
      this.channels.set(channelName, channel);
    }

    // Subscribe and track presence
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: this.currentUser.id,
          user_name: this.currentUser.name,
          user_avatar: this.currentUser.avatar,
          cursor: { x: 0, y: 0 },
          selection: null,
          is_typing: false,
          last_activity: new Date().toISOString()
        });
      }
    });

    return channel;
  }

  private setupChannelHandlers(channel: RealtimeChannel, entityType: string, entityId: string) {
    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      this.presenceState.set(channel.topic, state);
      this.updateCollaboratorAvatars(state);
    });

    // Handle user join
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      const user = newPresences[0];
      this.showUserJoinedNotification(user);
      this.addCollaboratorCursor(user);
    });

    // Handle user leave
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      const user = leftPresences[0];
      this.removeCollaboratorCursor(user.user_id);
    });

    // Handle cursor movements
    channel.on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
      this.updateCollaboratorCursor(payload.user_id, payload.cursor);
    });

    // Handle selection changes
    channel.on('broadcast', { event: 'selection_change' }, ({ payload }) => {
      this.highlightCollaboratorSelection(payload.user_id, payload.selection);
    });

    // Handle typing indicators
    channel.on('broadcast', { event: 'typing_status' }, ({ payload }) => {
      this.updateTypingIndicator(payload.user_id, payload.is_typing);
    });

    // Handle optimistic updates broadcast
    channel.on('broadcast', { event: 'optimistic_update' }, ({ payload }) => {
      this.mergeOptimisticUpdate(payload);
    });
  }

  // Broadcast cursor position
  broadcastCursorPosition(x: number, y: number) {
    const channel = this.getActiveChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          user_id: this.currentUser.id,
          cursor: { x, y }
        }
      });
    }
  }

  // Broadcast typing status
  broadcastTypingStatus(isTyping: boolean) {
    const channel = this.getActiveChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing_status',
        payload: {
          user_id: this.currentUser.id,
          is_typing: isTyping,
          field_id: this.currentFieldId
        }
      });
    }
  }
}

// Collaborative cursor component
export function CollaborativeCursors({ collaborators }: CollaborativeCursorsProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {collaborators.map((collaborator) => (
          <motion.div
            key={collaborator.user_id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: collaborator.cursor.x,
              y: collaborator.cursor.y
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300
            }}
            className="absolute flex items-center"
            style={{
              left: collaborator.cursor.x,
              top: collaborator.cursor.y
            }}
          >
            {/* Cursor pointer */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              style={{
                filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.2))`,
                transform: 'rotate(-45deg)'
              }}
            >
              <path
                d="M0 0L20 10L10 20L0 0Z"
                fill={collaborator.color}
              />
            </svg>

            {/* User label */}
            <span
              className="ml-2 rounded-full px-2 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: collaborator.color }}
            >
              {collaborator.user_name}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

### 6.2 Conflict Resolution Strategy

```typescript
// Operational Transformation for conflict resolution
export class ConflictResolver {
  private documentVersion: number = 0;
  private pendingOperations: Operation[] = [];
  private acknowledgePending: Map<string, Operation> = new Map();

  // Apply local change with OT
  async applyLocalChange(operation: Operation) {
    // Transform against pending operations
    let transformedOp = operation;
    for (const pendingOp of this.pendingOperations) {
      transformedOp = this.transformOperation(transformedOp, pendingOp);
    }

    // Apply to local state (optimistic)
    this.applyToLocalState(transformedOp);

    // Send to server
    const result = await this.sendOperation(transformedOp);

    if (result.conflict) {
      // Handle conflict
      return this.resolveConflict(transformedOp, result.serverOperation);
    }

    // Update version
    this.documentVersion = result.version;
    return transformedOp;
  }

  // Transform operation against another (OT algorithm)
  private transformOperation(op1: Operation, op2: Operation): Operation {
    // Text operations
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return op1;
      } else if (op1.position > op2.position) {
        return { ...op1, position: op1.position + op2.length };
      } else {
        // Same position - use user ID for deterministic ordering
        return op1.userId < op2.userId
          ? op1
          : { ...op1, position: op1.position + op2.length };
      }
    }

    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return op1;
      } else {
        return { ...op1, position: op1.position + op2.length };
      }
    }

    // Field updates
    if (op1.type === 'update' && op2.type === 'update') {
      if (op1.field === op2.field) {
        // Last-write-wins with user notification
        this.notifyConflict(op1, op2);
        return op1.timestamp > op2.timestamp ? op1 : op2;
      }
    }

    return op1;
  }

  // Three-way merge for complex conflicts
  private async resolveConflict(
    localOp: Operation,
    serverOp: Operation
  ): Promise<Operation> {
    // Get common ancestor
    const baseVersion = await this.getBaseVersion(localOp.version);

    // Three-way merge
    const merged = this.threeWayMerge(baseVersion, localOp, serverOp);

    // Show conflict resolution UI if needed
    if (merged.requiresUserInput) {
      const resolution = await this.showConflictDialog({
        local: localOp,
        server: serverOp,
        base: baseVersion,
        suggestions: merged.suggestions
      });

      return resolution;
    }

    return merged.result;
  }

  // Smart conflict resolution UI
  private async showConflictDialog(conflict: ConflictInfo): Promise<Operation> {
    return new Promise((resolve) => {
      const dialog = (
        <ConflictResolutionDialog
          conflict={conflict}
          onResolve={(resolution) => {
            resolve(resolution);
            closeDialog();
          }}
          strategies={[
            { label: 'Keep Mine', action: () => conflict.local },
            { label: 'Keep Theirs', action: () => conflict.server },
            { label: 'Merge Both', action: () => this.mergeBoth(conflict) },
            { label: 'Custom', action: () => this.customMerge(conflict) }
          ]}
        />
      );

      showDialog(dialog);
    });
  }
}
```

---

## 7. State Management Excellence

### 7.1 Optimistic Updates Pattern

```typescript
// Optimistic update manager with rollback support
export class OptimisticUpdateManager {
  private optimisticUpdates: Map<string, OptimisticUpdate> = new Map();
  private rollbackHandlers: Map<string, () => void> = new Map();

  async executeOptimisticUpdate<T>(
    key: string,
    optimisticData: T,
    serverCall: () => Promise<T>,
    options: OptimisticOptions = {}
  ): Promise<T> {
    const updateId = generateUpdateId();

    // Store original state for rollback
    const originalData = queryClient.getQueryData([key]);

    // Apply optimistic update immediately
    queryClient.setQueryData([key], (old: any) => {
      if (options.merge) {
        return { ...old, ...optimisticData };
      }
      return optimisticData;
    });

    // Track the update
    this.optimisticUpdates.set(updateId, {
      key,
      optimisticData,
      originalData,
      timestamp: Date.now(),
      status: 'pending',
    });

    // Show optimistic feedback
    if (options.showFeedback) {
      toast.loading('Saving changes...', { id: updateId });
    }

    try {
      // Execute server call
      const serverData = await serverCall();

      // Update with server data
      queryClient.setQueryData([key], serverData);

      // Mark as successful
      this.optimisticUpdates.set(updateId, {
        ...this.optimisticUpdates.get(updateId)!,
        status: 'success',
        serverData,
      });

      if (options.showFeedback) {
        toast.success('Changes saved!', { id: updateId });
      }

      return serverData;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData([key], originalData);

      // Mark as failed
      this.optimisticUpdates.set(updateId, {
        ...this.optimisticUpdates.get(updateId)!,
        status: 'failed',
        error,
      });

      if (options.showFeedback) {
        toast.error('Failed to save changes. Please try again.', { id: updateId });
      }

      // Execute rollback handler if provided
      const rollbackHandler = this.rollbackHandlers.get(updateId);
      if (rollbackHandler) {
        rollbackHandler();
      }

      throw error;
    } finally {
      // Cleanup after delay
      setTimeout(() => {
        this.optimisticUpdates.delete(updateId);
        this.rollbackHandlers.delete(updateId);
      }, 5000);
    }
  }

  // Batch optimistic updates
  async executeBatchOptimistic(updates: BatchUpdate[]): Promise<BatchResult> {
    const results: BatchResult = {
      successful: [],
      failed: [],
      rollbackStack: [],
    };

    // Apply all optimistic updates first
    const rollbackStack: Array<() => void> = [];

    for (const update of updates) {
      const originalData = queryClient.getQueryData([update.key]);
      queryClient.setQueryData([update.key], update.optimisticData);

      rollbackStack.push(() => {
        queryClient.setQueryData([update.key], originalData);
      });
    }

    // Execute server calls in parallel
    const promises = updates.map(async (update) => {
      try {
        const result = await update.serverCall();
        results.successful.push({ ...update, result });
        return { success: true, data: result };
      } catch (error) {
        results.failed.push({ ...update, error });
        return { success: false, error };
      }
    });

    const outcomes = await Promise.all(promises);

    // If any failed, rollback all
    if (results.failed.length > 0 && updates[0]?.options?.atomicTransaction) {
      rollbackStack.forEach((rollback) => rollback());
      throw new BatchUpdateError('Batch update failed', results);
    }

    return results;
  }
}

// Hook for optimistic updates
export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseOptimisticMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const [isOptimistic, setIsOptimistic] = useState(false);

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      setIsOptimistic(true);

      // Apply optimistic update
      if (options.optimisticUpdate) {
        const optimisticData = options.optimisticUpdate(variables);

        queryClient.setQueryData(options.queryKey, (old: any) =>
          options.updater ? options.updater(old, optimisticData) : optimisticData
        );
      }

      try {
        const result = await mutationFn(variables);
        setIsOptimistic(false);
        return result;
      } catch (error) {
        setIsOptimistic(false);

        // Rollback optimistic update
        if (options.rollbackOnError) {
          await queryClient.invalidateQueries({ queryKey: options.queryKey });
        }

        throw error;
      }
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
    ...options.mutationOptions,
  });
}
```

### 7.2 Cache Invalidation Strategy

```typescript
// Intelligent cache invalidation
export class CacheInvalidationStrategy {
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private invalidationQueue: InvalidationTask[] = [];
  private isProcessing = false;

  // Register cache dependencies
  registerDependency(source: string, dependsOn: string[]) {
    for (const dep of dependsOn) {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set());
      }
      this.dependencyGraph.get(dep)!.add(source);
    }
  }

  // Smart invalidation with cascading
  async invalidate(key: string | string[], options: InvalidationOptions = {}): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];

    // Build invalidation set with dependencies
    const toInvalidate = new Set<string>();
    const visited = new Set<string>();

    const traverse = (k: string) => {
      if (visited.has(k)) return;
      visited.add(k);
      toInvalidate.add(k);

      // Add dependent caches
      const dependents = this.dependencyGraph.get(k);
      if (dependents) {
        for (const dep of dependents) {
          traverse(dep);
        }
      }
    };

    for (const k of keys) {
      traverse(k);
    }

    // Queue invalidation tasks
    const tasks = Array.from(toInvalidate).map((k) => ({
      key: k,
      priority: options.priority || 'normal',
      timestamp: Date.now(),
    }));

    this.invalidationQueue.push(...tasks);

    // Process queue
    if (!this.isProcessing) {
      await this.processInvalidationQueue();
    }
  }

  private async processInvalidationQueue() {
    if (this.isProcessing || this.invalidationQueue.length === 0) return;

    this.isProcessing = true;

    // Sort by priority and timestamp
    this.invalidationQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });

    // Process in batches
    const batchSize = 5;
    while (this.invalidationQueue.length > 0) {
      const batch = this.invalidationQueue.splice(0, batchSize);

      await Promise.all(
        batch.map((task) =>
          queryClient.invalidateQueries({
            queryKey: [task.key],
            refetchType: 'active',
          })
        )
      );

      // Small delay between batches to prevent overwhelming
      if (this.invalidationQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    this.isProcessing = false;
  }

  // Selective cache updates
  async updateCache<T>(
    key: string,
    updater: (old: T) => T,
    options: UpdateOptions = {}
  ): Promise<T | undefined> {
    const currentData = queryClient.getQueryData<T>([key]);

    if (!currentData) {
      if (options.createIfNotExists) {
        const newData = updater(options.defaultValue as T);
        queryClient.setQueryData([key], newData);
        return newData;
      }
      return undefined;
    }

    const newData = updater(currentData);

    // Check if data actually changed
    if (options.deepCompare) {
      if (isEqual(currentData, newData)) {
        return currentData;
      }
    }

    queryClient.setQueryData([key], newData);

    // Invalidate dependents if needed
    if (options.invalidateDependents) {
      await this.invalidate(key, { priority: 'low' });
    }

    return newData;
  }
}

// Hook for intelligent cache management
export function useSmartCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: SmartCacheOptions = {}
) {
  const [cacheStrategy] = useState(() => new CacheInvalidationStrategy());

  // Register dependencies
  useEffect(() => {
    if (options.dependsOn) {
      cacheStrategy.registerDependency(key, options.dependsOn);
    }
  }, [key, options.dependsOn]);

  // Setup real-time invalidation
  useEffect(() => {
    if (options.realtimeInvalidation) {
      const channel = supabase
        .channel(`cache-${key}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: options.table!,
          },
          () => {
            cacheStrategy.invalidate(key, { priority: 'high' });
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [key, options.realtimeInvalidation, options.table]);

  return useQuery({
    queryKey: [key],
    queryFn: fetcher,
    staleTime: options.staleTime || 5 * 60 * 1000, // 5 minutes
    gcTime: options.gcTime || 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: options.refetchOnFocus ?? false,
    refetchInterval: options.refetchInterval,
  });
}
```

---

## 8. Component Architecture

### 8.1 Compound Components Pattern

```typescript
// Compound component for complex UI
interface TaskCardCompound {
  Root: typeof TaskCardRoot;
  Header: typeof TaskCardHeader;
  Body: typeof TaskCardBody;
  Actions: typeof TaskCardActions;
  Priority: typeof TaskCardPriority;
  Assignee: typeof TaskCardAssignee;
  DueDate: typeof TaskCardDueDate;
  Progress: typeof TaskCardProgress;
}

const TaskCardContext = createContext<TaskCardContextValue | null>(null);

function TaskCardRoot({ children, task, onUpdate, ...props }: TaskCardRootProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localTask, setLocalTask] = useState(task);
  const [hasChanges, setHasChanges] = useState(false);

  const value = useMemo(() => ({
    task: localTask,
    isEditing,
    setIsEditing,
    updateField: (field: string, value: any) => {
      setLocalTask(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    saveChanges: async () => {
      if (hasChanges) {
        await onUpdate(localTask);
        setHasChanges(false);
        setIsEditing(false);
      }
    },
    cancelChanges: () => {
      setLocalTask(task);
      setHasChanges(false);
      setIsEditing(false);
    }
  }), [localTask, isEditing, hasChanges, task, onUpdate]);

  return (
    <TaskCardContext.Provider value={value}>
      <motion.div
        layoutId={`task-${task.id}`}
        className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        whileHover={{ scale: 1.01 }}
        {...props}
      >
        {children}
      </motion.div>
    </TaskCardContext.Provider>
  );
}

function TaskCardHeader({ children, className, ...props }: TaskCardHeaderProps) {
  const { task, isEditing, setIsEditing } = useTaskCardContext();

  return (
    <div className={cn("flex items-start justify-between mb-3", className)} {...props}>
      {isEditing ? (
        <input
          type="text"
          value={task.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="flex-1 text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-[#E4002B] outline-none"
        />
      ) : (
        <h3 className="flex-1 text-lg font-semibold text-gray-900">
          {task.title}
        </h3>
      )}
      {children}
    </div>
  );
}

// Export compound component
export const TaskCard: TaskCardCompound = Object.assign(TaskCardRoot, {
  Root: TaskCardRoot,
  Header: TaskCardHeader,
  Body: TaskCardBody,
  Actions: TaskCardActions,
  Priority: TaskCardPriority,
  Assignee: TaskCardAssignee,
  DueDate: TaskCardDueDate,
  Progress: TaskCardProgress
});

// Usage example
function TaskList() {
  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} onUpdate={updateTask}>
          <TaskCard.Header>
            <TaskCard.Priority />
          </TaskCard.Header>
          <TaskCard.Body>
            <TaskCard.Assignee />
            <TaskCard.DueDate />
            <TaskCard.Progress />
          </TaskCard.Body>
          <TaskCard.Actions>
            <Button size="sm" variant="ghost">Edit</Button>
            <Button size="sm" variant="ghost">Archive</Button>
          </TaskCard.Actions>
        </TaskCard>
      ))}
    </div>
  );
}
```

### 8.2 Headless UI Components

```typescript
// Headless dropdown with accessibility
export function useDropdown(options: UseDropdownOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
          event.preventDefault();
          setIsOpen(true);
          setHighlightedIndex(0);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) => (prev < options.items.length - 1 ? prev + 1 : 0));
          break;

        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.items.length - 1));
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (highlightedIndex >= 0) {
            selectItem(options.items[highlightedIndex]);
          }
          break;

        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;

        case 'Tab':
          setIsOpen(false);
          break;

        default:
          // Type-ahead search
          if (event.key.length === 1) {
            const index = options.items.findIndex((item) =>
              item.label.toLowerCase().startsWith(event.key.toLowerCase())
            );
            if (index >= 0) {
              setHighlightedIndex(index);
            }
          }
      }
    },
    [isOpen, highlightedIndex, options.items]
  );

  // Click outside handler
  useClickOutside([triggerRef, menuRef], () => setIsOpen(false));

  // Focus management
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      itemRefs.current[highlightedIndex]?.focus();
    }
  }, [highlightedIndex, isOpen]);

  const selectItem = useCallback(
    (item: DropdownItem) => {
      if (options.multiple) {
        setSelectedItems((prev) =>
          prev.includes(item.value) ? prev.filter((v) => v !== item.value) : [...prev, item.value]
        );
      } else {
        setSelectedItems([item.value]);
        setIsOpen(false);
      }

      options.onSelect?.(item);
    },
    [options]
  );

  return {
    isOpen,
    setIsOpen,
    highlightedIndex,
    selectedItems,
    triggerProps: {
      ref: triggerRef,
      'aria-haspopup': 'listbox' as const,
      'aria-expanded': isOpen,
      'aria-controls': 'dropdown-menu',
      onClick: () => setIsOpen(!isOpen),
      onKeyDown: handleKeyDown,
    },
    menuProps: {
      ref: menuRef,
      id: 'dropdown-menu',
      role: 'listbox',
      'aria-multiselectable': options.multiple,
      'aria-activedescendant':
        highlightedIndex >= 0 ? `dropdown-item-${highlightedIndex}` : undefined,
    },
    getItemProps: (item: DropdownItem, index: number) => ({
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
      id: `dropdown-item-${index}`,
      role: 'option',
      'aria-selected': selectedItems.includes(item.value),
      tabIndex: highlightedIndex === index ? 0 : -1,
      onClick: () => selectItem(item),
      onMouseEnter: () => setHighlightedIndex(index),
    }),
  };
}

// Headless combobox with search
export function useCombobox<T>(options: UseComboboxOptions<T>) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const filteredItems = useMemo(() => {
    if (!query) return options.items;

    return options.items.filter((item) =>
      options.itemToString(item).toLowerCase().includes(query.toLowerCase())
    );
  }, [query, options.items, options.itemToString]);

  const dropdown = useDropdown({
    items: filteredItems.map((item) => ({
      value: options.itemToValue(item),
      label: options.itemToString(item),
    })),
    onSelect: (dropdownItem) => {
      const item = filteredItems.find((i) => options.itemToValue(i) === dropdownItem.value);
      if (item) {
        setSelectedItem(item);
        setQuery(options.itemToString(item));
        options.onSelect?.(item);
      }
    },
  });

  return {
    ...dropdown,
    inputProps: {
      value: query,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setIsOpen(true);
      },
      onFocus: () => setIsOpen(true),
      'aria-autocomplete': 'list' as const,
      'aria-controls': 'combobox-menu',
      role: 'combobox',
    },
    filteredItems,
    selectedItem,
    clearSelection: () => {
      setSelectedItem(null);
      setQuery('');
    },
  };
}
```

---

## 9. Performance Optimization

### 9.1 Virtual Scrolling Implementation

```typescript
// Virtual scrolling for large lists
export function VirtualTaskList({
  tasks,
  height = 600,
  itemHeight = 80,
  overscan = 5
}: VirtualTaskListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      tasks.length - 1,
      Math.ceil((scrollTop + height) / itemHeight) + overscan
    );

    return {
      startIndex,
      endIndex,
      totalHeight: tasks.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [scrollTop, tasks.length, itemHeight, height, overscan]);

  const visibleTasks = tasks.slice(startIndex, endIndex + 1);

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Smooth scroll to item
  const scrollToItem = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const targetScrollTop = index * itemHeight;
      scrollElementRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [itemHeight]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    scrollToItem,
    scrollToTop: () => scrollToItem(0),
    scrollToBottom: () => scrollToItem(tasks.length - 1)
  }), [scrollToItem, tasks.length]);

  return (
    <div
      ref={scrollElementRef}
      className="overflow-auto"
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              style={{ height: itemHeight }}
              className="px-4"
            >
              <TaskCard task={task} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Intersection observer for lazy loading
export function useLazyLoad(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              callback();
            }
          });
        },
        {
          root: options.root || null,
          rootMargin: options.rootMargin || '100px',
          threshold: options.threshold || 0
        }
      );

      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);

  return elementRef;
}
```

### 9.2 Code Splitting Strategy

```typescript
// Dynamic imports with loading states
const DisciplinaryModule = dynamic(
  () => import('@/modules/disciplinary').then(mod => mod.DisciplinaryModule),
  {
    loading: () => <ModuleLoadingState module="Disciplinary Matters" />,
    ssr: false
  }
);

const TaskModule = dynamic(
  () => import('@/modules/tasks').then(mod => mod.TaskModule),
  {
    loading: () => <ModuleLoadingState module="Task Management" />,
    ssr: false
  }
);

// Route-based code splitting
export function AppRouter() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route
          path="disciplinary/*"
          element={
            <Suspense fallback={<ModuleLoadingState module="Disciplinary" />}>
              <DisciplinaryModule />
            </Suspense>
          }
        />
        <Route
          path="tasks/*"
          element={
            <Suspense fallback={<ModuleLoadingState module="Tasks" />}>
              <TaskModule />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

// Preload critical modules
export function preloadCriticalModules() {
  // Preload based on user role
  const { user } = useAuth();

  if (user?.role === 'admin') {
    // Admins likely to use disciplinary module
    import('@/modules/disciplinary');
  }

  // Everyone uses tasks
  import('@/modules/tasks');

  // Preload on hover for faster navigation
  const preloadOnHover = (moduleLoader: () => Promise<any>) => {
    let preloaded = false;
    return {
      onMouseEnter: () => {
        if (!preloaded) {
          moduleLoader();
          preloaded = true;
        }
      }
    };
  };

  return { preloadOnHover };
}

// Bundle analysis helpers
export const bundleSizeTargets = {
  'main': 200 * 1024,           // 200KB
  'disciplinary': 150 * 1024,   // 150KB
  'tasks': 180 * 1024,           // 180KB
  'vendor': 400 * 1024,          // 400KB
  'total': 1024 * 1024           // 1MB total
};
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1)

**Database & Infrastructure**

- [ ] Deploy database schemas for both modules
- [ ] Implement RLS policies with comprehensive testing
- [ ] Set up Supabase Realtime channels
- [ ] Create database views and indexes
- [ ] Configure Edge Functions for complex operations

**Core Services**

- [ ] Implement disciplinary service layer
- [ ] Implement task service layer
- [ ] Set up optimistic update manager
- [ ] Configure cache invalidation strategy
- [ ] Create real-time collaboration manager

**Authentication & Authorization**

- [ ] Extend role-based permissions
- [ ] Add module-specific access controls
- [ ] Implement audit logging

### Phase 2: UI Components (Week 2)

**Design System**

- [ ] Create compound components for tasks
- [ ] Build disciplinary workflow components
- [ ] Implement headless UI primitives
- [ ] Add micro-interaction animations
- [ ] Design loading and empty states

**Premium UX Features**

- [ ] Virtual scrolling for large lists
- [ ] Drag-and-drop task management
- [ ] Keyboard navigation system
- [ ] Context menus and shortcuts
- [ ] Progressive disclosure patterns

### Phase 3: Real-Time Features (Week 3)

**Collaboration**

- [ ] Implement presence tracking
- [ ] Add collaborative cursors
- [ ] Build typing indicators
- [ ] Create conflict resolution UI
- [ ] Add live notifications

**Synchronization**

- [ ] Implement offline queue
- [ ] Add background sync
- [ ] Build optimistic updates
- [ ] Create rollback mechanisms

### Phase 4: Polish & Optimization (Week 4)

**Performance**

- [ ] Implement code splitting
- [ ] Add route preloading
- [ ] Optimize bundle sizes
- [ ] Add performance monitoring
- [ ] Implement image optimization

**Quality Assurance**

- [ ] Write comprehensive tests
- [ ] Add E2E test coverage
- [ ] Perform accessibility audit
- [ ] Security penetration testing
- [ ] Load testing (100+ concurrent users)

---

## 11. Potential Risks and Mitigations

### Technical Risks

| Risk                             | Impact | Probability | Mitigation                                           |
| -------------------------------- | ------ | ----------- | ---------------------------------------------------- |
| Real-time sync conflicts         | High   | Medium      | Implement OT algorithm with UI for manual resolution |
| Performance degradation at scale | High   | Low         | Virtual scrolling, pagination, indexed queries       |
| Complex workflow edge cases      | Medium | High        | Comprehensive state machines with fallback states    |
| Browser compatibility issues     | Low    | Low         | Progressive enhancement, polyfills                   |
| Offline sync failures            | Medium | Medium      | Robust queue with retry logic and user notifications |

### Implementation Risks

| Risk                   | Impact | Mitigation                                   |
| ---------------------- | ------ | -------------------------------------------- |
| Feature creep          | High   | Strict MVP scope, phased rollout             |
| Integration complexity | Medium | Incremental integration, feature flags       |
| User adoption          | Medium | Onboarding tours, progressive disclosure     |
| Data migration issues  | High   | Comprehensive backup strategy, rollback plan |

---

## 12. Testing Strategy

### Unit Testing

```typescript
// Service layer tests
describe('DisciplinaryService', () => {
  it('should create incident with workflow', async () => {
    const incident = await disciplinaryService.createIncident({...});
    expect(incident.workflow_stages).toHaveLength(5);
  });

  it('should handle workflow transitions', async () => {
    const result = await disciplinaryService.advanceWorkflow({...});
    expect(result.currentStage).toBe('investigation');
  });
});
```

### Integration Testing

```typescript
// Real-time collaboration tests
describe('CollaborationManager', () => {
  it('should sync cursor positions across clients', async () => {
    const client1 = createTestClient();
    const client2 = createTestClient();

    await client1.joinCollaboration('task', '123');
    await client2.joinCollaboration('task', '123');

    client1.broadcastCursorPosition(100, 200);

    await waitFor(() => {
      expect(client2.collaborators[0].cursor).toEqual({ x: 100, y: 200 });
    });
  });
});
```

### E2E Testing

```typescript
// Playwright tests for critical workflows
test('Complete disciplinary workflow', async ({ page }) => {
  // Create incident
  await page.goto('/dashboard/disciplinary/new');
  await page.fill('[name="title"]', 'Test Incident');
  await page.click('[type="submit"]');

  // Verify workflow initialized
  await expect(page.locator('.workflow-stage')).toHaveCount(5);

  // Advance through stages
  await page.click('[data-action="investigate"]');
  await expect(page.locator('.current-stage')).toContainText('Investigation');
});
```

---

## 13. Deployment Considerations

### Environment Configuration

```env
# Production environment variables
NEXT_PUBLIC_REALTIME_URL=wss://wgdmgvonqysflwdiiols.supabase.co/realtime/v1
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_COLLABORATION_ENABLED=true
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_SENTRY_DSN=https://...
```

### Migration Strategy

1. Deploy database changes with backward compatibility
2. Feature flag new modules for gradual rollout
3. Monitor performance metrics during rollout
4. Implement rollback procedures
5. Document breaking changes

### Monitoring & Observability

- Real User Monitoring (RUM) for UX metrics
- Application Performance Monitoring (APM)
- Error tracking with Sentry
- Custom dashboards for module usage
- Database query performance monitoring

---

## Conclusion

This premium UX-first architecture provides a robust foundation for the Disciplinary Matters and Task Management modules. The design prioritizes exceptional user experience through instant feedback, smooth animations, and real-time collaboration while maintaining enterprise-grade security and aviation industry compliance.

Key architectural decisions:

- **Optimistic UI** for sub-100ms perceived performance
- **Real-time collaboration** with conflict resolution
- **Compound components** for flexible UI composition
- **Smart caching** with dependency tracking
- **Virtual scrolling** for handling 1000+ items
- **Progressive enhancement** for broad compatibility

The phased implementation approach ensures systematic delivery while maintaining system stability and allowing for iterative improvements based on user feedback.

---

**Document Version**: 1.0.0
**Last Updated**: October 2025
**Next Review**: After Phase 1 completion
