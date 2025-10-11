# VoltAgent Subagents - Quick Reference Guide

**Installation Date**: October 10, 2025
**Project**: Air Niugini B767 Pilot Management System
**Total Agents Installed**: 10 production-ready subagents

---

## 📋 Installed Agents Overview

| Agent | Category | Primary Use Case |
|-------|----------|------------------|
| `code-reviewer` | Quality & Security | Pre-commit code quality checks |
| `debugger` | Quality & Security | Bug investigation and resolution |
| `security-auditor` | Quality & Security | Security vulnerability scanning |
| `qa-expert` | Quality & Security | Test automation and coverage |
| `performance-engineer` | Quality & Security | Performance optimization |
| `nextjs-developer` | Language Specialist | Next.js 14+ development |
| `typescript-pro` | Language Specialist | TypeScript best practices |
| `database-optimizer` | Data & AI | Supabase/PostgreSQL optimization |
| `postgres-pro` | Data & AI | PostgreSQL expert |
| `documentation-engineer` | Developer Experience | Technical documentation |

---

## 🚀 Quick Start - How to Invoke Agents

### Method 1: Explicit Invocation (Recommended)

Ask Claude Code directly to use a specific agent:

```
"Use the code-reviewer agent to review my latest changes"
"Ask the debugger agent to investigate this error"
"Have the security-auditor check for vulnerabilities"
```

### Method 2: Automatic Invocation

Claude Code will automatically invoke relevant agents when it detects appropriate tasks:

- Making code changes → `code-reviewer` may be invoked
- Encountering errors → `debugger` may be invoked
- Performance issues → `performance-engineer` may be invoked

### Method 3: Parallel Execution (Fastest)

Run multiple agents simultaneously for comprehensive review:

```
"Use code-reviewer, security-auditor, and qa-expert in parallel to review this PR"
```

---

## 🎯 Common Workflows for Air Niugini Project

### Workflow 1: Pre-Commit Quality Gate (RECOMMENDED)

**Use this before EVERY commit:**

```
"Run code-reviewer and security-auditor in parallel to validate my changes"
```

**What it does:**
- ✅ Code quality check (80%+ coverage, complexity <10)
- ✅ Security vulnerability scan
- ✅ Best practices enforcement
- ✅ TypeScript type safety
- ✅ Air Niugini branding compliance

**Time**: ~60 seconds (parallel execution)

---

### Workflow 2: Production Deployment Review

**Use before deploying to Vercel:**

```
"Use code-reviewer, security-auditor, and qa-expert in parallel for production deployment review"
```

**What it does:**
- ✅ Complete code review
- ✅ Security audit
- ✅ Test coverage validation
- ✅ Performance check
- ✅ Documentation review

**Time**: ~90 seconds (parallel execution)

---

### Workflow 3: Bug Investigation

**Use when encountering errors:**

```
"Use the debugger agent to investigate this [describe issue]"
```

**What it does:**
- 🔍 Root cause analysis
- 🔍 Stack trace examination
- 🔍 Reproduces issue
- 🔍 Suggests fixes
- 🔍 Prevents regression

**Time**: ~30-60 seconds

---

### Workflow 4: Database Query Optimization

**Use for Supabase query improvements:**

```
"Use database-optimizer and postgres-pro to optimize this query"
```

**What it does:**
- ⚡ Query performance analysis
- ⚡ Index recommendations
- ⚡ RLS policy review
- ⚡ Join optimization
- ⚡ View optimization

**Time**: ~45 seconds

---

### Workflow 5: New Feature Development

**Use when building new features:**

```
"I'm building [feature]. Use nextjs-developer and typescript-pro to help implement it"
```

**What it does:**
- 🏗️ Next.js 14 App Router patterns
- 🏗️ TypeScript strict mode compliance
- 🏗️ Service layer architecture
- 🏗️ Component organization
- 🏗️ Air Niugini branding

**Time**: Varies based on complexity

---

### Workflow 6: Performance Optimization

**Use when experiencing slow performance:**

```
"Use performance-engineer to analyze and optimize [feature/page]"
```

**What it does:**
- ⚡ Performance profiling
- ⚡ Bundle size analysis
- ⚡ React Query optimization
- ⚡ PWA cache strategy
- ⚡ Lazy loading recommendations

**Time**: ~60 seconds

---

### Workflow 7: Documentation Update

**Use after implementing new features:**

```
"Use documentation-engineer to document this new feature"
```

**What it does:**
- 📚 README updates
- 📚 Code comments
- 📚 API documentation
- 📚 Architecture docs
- 📚 Migration guides

**Time**: ~30 seconds

---

## 🔧 Agent-Specific Usage Examples

### `code-reviewer`

**Best for:**
- Pre-commit reviews
- Pull request validation
- Code quality enforcement
- Best practices checking

**Example:**
```
"Use code-reviewer to review src/lib/leave-service.ts"
```

**Checks:**
- Security vulnerabilities (injection, XSS, auth)
- Code quality (complexity, duplication, naming)
- Performance issues (N+1 queries, memory leaks)
- Test coverage (>80% required)
- Air Niugini branding compliance

---

### `debugger`

**Best for:**
- Bug investigation
- Error analysis
- Stack trace examination
- Root cause identification

**Example:**
```
"Use debugger to investigate why leave requests aren't filtering by roster period"
```

**Analyzes:**
- Error messages and stack traces
- Component state and props
- API request/response
- Database queries
- Browser console logs

---

### `security-auditor`

**Best for:**
- Pre-deployment security checks
- Vulnerability scanning
- RLS policy validation
- Authentication/authorization review

**Example:**
```
"Use security-auditor to check the leave management system"
```

**Scans:**
- Input validation
- SQL injection risks
- XSS vulnerabilities
- CSRF protection
- RLS policy gaps
- Environment variable exposure
- Dependency vulnerabilities

---

### `qa-expert`

**Best for:**
- Test automation
- Test coverage analysis
- E2E test creation
- Test quality review

**Example:**
```
"Use qa-expert to create Playwright tests for the new certification calendar"
```

**Provides:**
- Playwright E2E test scripts
- Jest unit test templates
- Test coverage reports
- Edge case identification
- Mock data strategies

---

### `performance-engineer`

**Best for:**
- Performance profiling
- Bundle size optimization
- React Query tuning
- Database query optimization

**Example:**
```
"Use performance-engineer to optimize the dashboard page load time"
```

**Analyzes:**
- React component rendering
- Bundle size (via build analyzer)
- Database query efficiency
- API response times
- PWA cache effectiveness
- Image optimization

---

### `nextjs-developer`

**Best for:**
- Next.js App Router patterns
- Server components vs client components
- Routing and navigation
- API route optimization

**Example:**
```
"Use nextjs-developer to help build a new certification report page"
```

**Expertise:**
- Next.js 14+ App Router
- Server/Client component patterns
- API route handlers
- Middleware
- Metadata and SEO
- Streaming and Suspense

---

### `typescript-pro`

**Best for:**
- TypeScript type safety
- Zod schema creation
- Generic types
- Type inference

**Example:**
```
"Use typescript-pro to create proper types for the new roster period API"
```

**Provides:**
- Strict TypeScript patterns
- Zod validation schemas
- Type guards
- Generic utilities
- Interface design
- Type inference optimization

---

### `database-optimizer`

**Best for:**
- Query performance tuning
- Index recommendations
- RLS policy optimization
- Join efficiency

**Example:**
```
"Use database-optimizer to optimize the expiring certifications query"
```

**Analyzes:**
- Query execution plans
- Index usage
- Join strategies
- Subquery optimization
- View performance
- RLS policy impact

---

### `postgres-pro`

**Best for:**
- PostgreSQL-specific features
- Complex queries
- Database migrations
- Schema design

**Example:**
```
"Use postgres-pro to design the new pilot training history table"
```

**Expertise:**
- PostgreSQL 14+ features
- JSONB operations
- Full-text search
- Materialized views
- Partitioning
- Trigger functions

---

### `documentation-engineer`

**Best for:**
- API documentation
- README updates
- Code comments
- Architecture docs

**Example:**
```
"Use documentation-engineer to update the README with the new leave management features"
```

**Creates:**
- Comprehensive README files
- API documentation
- Code comments
- Architecture diagrams (textual)
- Migration guides
- Changelog entries

---

## 💡 Best Practices

### 1. Always Use Quality Gates

**Before committing:**
```
"Use code-reviewer and security-auditor in parallel"
```

**Before deploying:**
```
"Use code-reviewer, security-auditor, and qa-expert in parallel"
```

### 2. Use Parallel Execution for Speed

**❌ Slow (Sequential):**
```
"Use code-reviewer to review, then security-auditor, then qa-expert"
```
**Time**: ~180 seconds

**✅ Fast (Parallel):**
```
"Use code-reviewer, security-auditor, and qa-expert in parallel"
```
**Time**: ~60 seconds (67% time savings!)

### 3. Be Specific About Scope

**❌ Vague:**
```
"Review my code"
```

**✅ Specific:**
```
"Use code-reviewer to review src/lib/leave-eligibility-service.ts focusing on the seniority calculation logic"
```

### 4. Leverage Agent Expertise

Each agent has specialized knowledge. Use the right tool for the job:

- **Database issues** → `database-optimizer` or `postgres-pro`
- **TypeScript errors** → `typescript-pro`
- **Next.js patterns** → `nextjs-developer`
- **Security concerns** → `security-auditor`
- **Performance issues** → `performance-engineer`
- **Testing needs** → `qa-expert`
- **Bug investigation** → `debugger`
- **Code quality** → `code-reviewer`
- **Documentation** → `documentation-engineer`

---

## 📊 Agent Performance Metrics

| Metric | Value |
|--------|-------|
| **Average agent execution time** | 30-60 seconds |
| **Parallel execution (3 agents)** | ~60 seconds |
| **Sequential execution (3 agents)** | ~180 seconds |
| **Time savings (parallel vs sequential)** | 67% |
| **Token usage per agent** | ~15,000-20,000 |
| **Session token budget** | 200,000 total |
| **Recommended max parallel agents** | 3-4 agents |

---

## 🎓 Learning Resources

### Agent Documentation

Each agent file (`.claude/agents/*.md`) contains:

- **Role definition**: What the agent specializes in
- **MCP Tool Suite**: Which tools the agent uses
- **Communication Protocol**: How the agent interacts
- **Development Workflow**: Step-by-step process
- **Best practices**: Agent-specific guidelines

### VoltAgent Repository

- **Full collection**: https://github.com/VoltAgent/awesome-claude-code-subagents
- **100+ agents**: Explore additional specialized agents
- **Community**: Join VoltAgent Discord for support

---

## 🚨 Common Issues & Solutions

### Issue 1: Agent Not Found

**Error**: "I don't see an agent named [agent-name]"

**Solution**: Ensure the agent file exists in `.claude/agents/` and restart Claude Code.

### Issue 2: Slow Performance

**Problem**: Agent takes too long to respond

**Solution**:
- Use parallel execution for multiple agents
- Be specific about scope to reduce analysis time
- Check token budget (agents use ~15k tokens each)

### Issue 3: Agent Not Invoked Automatically

**Problem**: Claude Code doesn't automatically use the right agent

**Solution**: Explicitly invoke the agent:
```
"Use the [agent-name] agent to [task]"
```

### Issue 4: Conflicting Recommendations

**Problem**: Multiple agents give different advice

**Solution**:
- Prioritize security and correctness over other concerns
- Use `code-reviewer` as the final authority on code quality
- Cross-reference with Air Niugini project standards (CLAUDE.md)

---

## 🔗 Integration with Air Niugini Standards

All VoltAgent subagents are configured to work with your project's specific requirements:

### 1. Air Niugini Branding
Agents check for:
- Color palette compliance (#E4002B red, #FFC72C gold)
- UI component standards
- FAA status indicators (red/yellow/green)

### 2. Service Layer Architecture
Agents enforce:
- Service function patterns (not direct API calls)
- Production-stable communication
- Proper error handling

### 3. Leave Management Rules
Agents validate:
- Rank separation (Captains vs First Officers)
- Seniority calculations
- 28-day roster period logic
- Crew availability checks

### 4. Database Patterns
Agents check:
- Production table usage (`pilots`, not `an_pilots`)
- RLS policy compliance
- View optimization
- Type safety with Supabase

---

## 📝 Quick Reference Commands

### Quality Gate (Pre-Commit)
```bash
# Invoke via Claude Code
"Run quality gate: use code-reviewer and security-auditor in parallel"
```

### Production Deployment Review
```bash
"Run deployment review: use code-reviewer, security-auditor, and qa-expert in parallel"
```

### Bug Investigation
```bash
"Use debugger to investigate: [describe issue]"
```

### Performance Check
```bash
"Use performance-engineer to analyze: [page/feature]"
```

### Database Optimization
```bash
"Use database-optimizer to optimize: [query/table]"
```

### Documentation Update
```bash
"Use documentation-engineer to document: [feature]"
```

---

## 🎯 Recommended Daily Usage

### Morning (Start of Development)
```
"Use code-reviewer to review yesterday's changes"
```

### During Development
- Use `nextjs-developer` for Next.js questions
- Use `typescript-pro` for TypeScript issues
- Use `debugger` for bug investigation
- Use `documentation-engineer` for new features

### Before Commit (End of Development)
```
"Use code-reviewer and security-auditor in parallel to validate my changes"
```

### Before Deployment (Production Release)
```
"Use code-reviewer, security-auditor, and qa-expert in parallel for production review"
```

---

## 🌟 Advanced Patterns

### Pattern 1: Full Feature Review
```
"Use nextjs-developer to implement [feature],
then typescript-pro to ensure type safety,
then code-reviewer and security-auditor in parallel for validation,
then documentation-engineer to document it"
```

### Pattern 2: Performance Investigation
```
"Use performance-engineer to identify bottlenecks,
then database-optimizer to optimize queries,
then code-reviewer to validate improvements"
```

### Pattern 3: Security Audit
```
"Use security-auditor to scan for vulnerabilities,
then postgres-pro to review RLS policies,
then code-reviewer to ensure fixes maintain code quality"
```

---

## 📞 Getting Help

### Agent Not Working as Expected?

1. **Check agent file exists**: `ls .claude/agents/[agent-name].md`
2. **Restart Claude Code**: Close and reopen the session
3. **Be explicit**: "Use the [agent-name] agent to [specific task]"
4. **Check token budget**: Each agent uses ~15k tokens

### Need More Agents?

Browse the full VoltAgent collection:
```bash
# Clone the full repository
git clone https://github.com/VoltAgent/awesome-claude-code-subagents.git

# Copy desired agents
cp awesome-claude-code-subagents/categories/[category]/[agent].md .claude/agents/
```

### Want to Customize an Agent?

1. Open the agent file: `.claude/agents/[agent-name].md`
2. Edit the frontmatter or content
3. Save and restart Claude Code
4. Test with: "Use [agent-name] to [task]"

---

**VoltAgent Subagents - Installed and Ready to Use!**
_Production-Ready AI Agents for Air Niugini B767 Pilot Management System_
_Version 1.0 - October 10, 2025_
