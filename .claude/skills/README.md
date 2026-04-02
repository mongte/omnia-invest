# Skills Directory

**Welcome to the skills folder!** This is where our curated collection of 15 essential AI skills for modern application development lives.

## 🤔 What Are Skills?

Skills are specialized instruction sets that teach AI assistants how to handle specific tasks. Think of them as expert knowledge modules that your AI can load on-demand.

**Simple analogy:** Just like you might consult different experts (a designer, a security expert, a marketer), skills let your AI become an expert in different areas when you need them.

---

## 📂 Folder Structure

Each skill lives in its own folder with this structure:

```
skills/
├── skill-name/              # Individual skill folder
│   ├── SKILL.md             # Main skill definition (required)
│   ├── scripts/             # Helper scripts (optional)
│   ├── examples/            # Usage examples (optional)
│   └── resources/           # Templates & resources (optional)
```

**Key point:** Only `SKILL.md` is required. Everything else is optional!

---

## How to Use Skills

### Step 1: Make sure skills are installed
Skills should be in your `.agent/skills/` directory.

### Step 2: Invoke a skill in your AI chat
Use the `@` symbol followed by the skill name:

```
@pm-agent help me design a new feature
```

or

```
@frontend-agent please create a new React component
```

### Step 3: The AI becomes an expert
The AI loads that skill's knowledge and helps you with specialized expertise!

---

## Core Skills Provided

### 🚀 Application & Team Roles
- `@pm-agent` - Planning, requirement breakdown, and prioritization
- `@senior-fullstack` - Complete web stack development and architecture
- `@frontend-agent` - Frontend UI/UX and logic specialist
- `@backend-agent` - Backend APIs, logic, and systems specialist
- `@qa-agent` - Quality assurance, edge-cases, and testing expert

### 🏗️ Architecture & Workflows
- `@code-reviewer` - Strict AI code reviews
- `@testing-qa` - E2E testing strategies and QA procedures

### 💻 Languages & Frameworks
- `@typescript-expert` - Strict TypeScript typings and structures
- `@react-best-practices` - React performance and hooks
- `@react-ui-patterns` - Modern UI state management paradigms
- `@nextjs-best-practices` - Next.js App Router and Server Components
- `@tailwind-patterns` - Modern CSS design systems via Tailwind

### 🎨 Design & UI
- `@ui-ux-designer` - Wireframing, accessibility, and user flows
- `@frontend-design` - High-quality visual implementations

### 🗄️ Backend & Databases
- `@auth-implementation-patterns` - Securing endpoints with JWT / OAuth

---

## Creating Your Own Skill

Want to create a new skill? Check out the pattern in this folder!

**Basic structure:**
```markdown
---
name: my-skill-name
description: "What this skill does"
---

# Skill Title

## Overview
[What this skill does]

## When to Use
- Use when [scenario]

## Instructions
[Step-by-step guide]
```
