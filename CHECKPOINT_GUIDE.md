# 🔖 CHECKPOINT & RESUME GUIDE FOR AI AGENTS

**THIS IS YOUR LIFELINE WHEN CREDITS RUN OUT**

---

## ⚡ QUICK REFERENCE: 60 SECONDS TO RESUME

### Step 1: Read State (10 sec)
```bash
Open: TASK_TRACKER.md
Find: Your task status
Look for: "Last Checkpoint" line
Copy: The checkpoint timestamp & description
```

### Step 2: Find Your Position (10 sec)
```bash
Last checkpoint tells you:
- Which file you were editing
- Which line number you stopped at
- What the NEXT step is
```

### Step 3: Resume Immediately (40 sec)
```bash
1. Open the file from checkpoint
2. Go to the line number indicated
3. Continue with the NEXT STEP stated
4. Do NOT restart from task beginning
```

---

## 📍 CHECKPOINT LOCATIONS IN TASK_TRACKER.md

Every task has a **"Checkpoint History"** section that looks like this:

```
### TASK 1.1: Home Page (`/`)
- **Status:** `NOT STARTED`
- **Estimated Tokens:** 2,500

**Checkpoint History:**
- **Checkpoint 1.1.0** (2026-05-03 00:00) - Task created
```

When you're IN PROGRESS, it will look like:

```
**Checkpoint History:**
- **Checkpoint 1.1.0** (2026-05-03 00:00) - Task created
- **Checkpoint 1.1.1** (2026-05-03 14:30) - HTML structure complete, working on hero section, resume at line 15 of index.html
- **Checkpoint 1.1.2** (2026-05-03 15:45) - Hero section done, add CTA buttons next
```

---

## 🎯 USING CHECKPOINTS: BY SCENARIO

### SCENARIO 1: I'm Starting Fresh
**What to do:**
1. Open TASK_TRACKER.md
2. Find a task with status `NOT STARTED`
3. Read all subtasks
4. Start with the first unchecked `[ ]` item
5. Add a new checkpoint when done

**Example:**
```
**Checkpoint 1.1.1** (2026-05-03 14:23)
- Started Task 1.1 (Home Page)
- Creating HTML structure for index.html
- Next: Add hero section with headline
```

---

### SCENARIO 2: Continuing from Last Checkpoint
**What to do:**
1. Find the LAST checkpoint in the task
2. Read the description
3. Open the file it mentions
4. Go to the line it specifies
5. Do the NEXT STEP described
6. Create new checkpoint when done

**Example:**
Last checkpoint says:
```
**Checkpoint 1.1.2** (2026-05-03 15:45) 
- Hero section complete
- Last file: frontend/html/index.html, line 45
- Next: Add "How It Works" section with 3 steps
```

You do:
```
1. Open: frontend/html/index.html
2. Go to: Line 45 (after hero section)
3. Add: "How It Works" section
4. When done, create checkpoint 1.1.3
```

---

### SCENARIO 3: My Work Was Interrupted / Credits Ran Out
**What to do IMMEDIATELY:**
1. **SAVE THIS FILE:** TASK_TRACKER.md
2. **CHECK YOUR WORK:**
   - What file was I editing? (e.g., index.html)
   - What was the last line I modified? (e.g., line 67)
   - Did I complete a subtask? (check it off with `[x]`)
3. **ADD A CHECKPOINT** in TASK_TRACKER.md:

```
**Checkpoint 1.1.3** (2026-05-03 16:12) - INCOMPLETE
- Status: IN PROGRESS
- Subtasks completed: 3 of 8
- Last file: frontend/html/index.html
- Last line modified: 67
- Current work: Adding "How It Works" section
- Next step: Add step 2 details (lines 68-75)
- Blocking issues: None
- Tokens used: ~800/2500
```

4. **VERIFY CHANGES SAVED** in the actual files (index.html, style.css, etc.)
5. **DO NOT MODIFY OTHER FILES**
6. **WAIT FOR NEW CREDITS**

---

## 📋 CHECKPOINT FIELDS EXPLAINED

When you create a checkpoint, include these fields:

| Field | What It Means | Example |
|-------|---------------|---------|
| **Timestamp** | When you stopped | 2026-05-03 16:30 |
| **Status** | Current state | IN PROGRESS, BLOCKED, ALMOST DONE |
| **Subtasks Completed** | X of Y | 3 of 8 |
| **Last File Modified** | Which file you were editing | frontend/html/index.html |
| **Last Line** | Last line you worked on (or range) | Lines 45-67 |
| **Current Work** | What you were doing | "Adding hero section buttons" |
| **Next Step** | Exactly what to do next | "Add CSS styling for buttons in style.css" |
| **Blocking Issues** | Any blockers? | None / Waiting for content / File missing |
| **Tokens Used** | Credits spent on this task | ~1200/2500 (if tracking) |

---

## 🚦 STATUS MEANINGS

- `NOT STARTED` - Nothing done yet, ready to begin
- `IN PROGRESS` - Currently working, might resume
- `BLOCKED` - Can't proceed (missing dependencies, need info)
- `COMPLETED` - All subtasks done, task is closed

---

## ✅ SUBTASK CHECKLIST FORMAT

Each task has subtasks like this:

```
### TASK 1.1: Home Page
- **Subtasks:**
  - [ ] Create HTML structure with semantic markup
  - [ ] Add hero section with headline & subheading
  - [ ] Implement "How It Works" section
```

**When you complete one, mark it:**
```
  - [x] Create HTML structure with semantic markup    ← DONE
  - [ ] Add hero section with headline & subheading    ← NEXT
  - [ ] Implement "How It Works" section
```

---

## 🔄 CHECKPOINT UPDATE WORKFLOW

### EVERY 30 MINUTES or 2-3 SUBTASKS (whichever comes first)

```
1. STOP current work
2. SAVE your file (Ctrl+S)
3. OPEN TASK_TRACKER.md
4. FIND your task
5. ADD a new checkpoint with:
   - Current timestamp
   - What's complete
   - What's next
6. SAVE TASK_TRACKER.md
7. RESUME work
```

**This takes 2 minutes but saves HOURS if credits run out.**

---

## 🛑 IF CREDITS RUN OUT MID-TASK

1. **IMMEDIATELY STOP** - Do not write more code
2. **Save file you're in** (Ctrl+S)
3. **Open TASK_TRACKER.md**
4. **Add checkpoint** with exact state:
   - Line number you stopped at
   - What the next line should be
   - Status: mark as `INCOMPLETE` or `IN PROGRESS`
5. **Save TASK_TRACKER.md**
6. **THAT'S IT** - Everything is saved for resume

**What NOT to do:**
- ❌ Don't continue coding "just a bit more"
- ❌ Don't delete checkpoints
- ❌ Don't modify TASK_TRACKER format
- ❌ Don't start a new task if mid-way through another

---

## 🎓 EXAMPLES OF GOOD CHECKPOINTS

### Example 1: Completed Subtask
```
**Checkpoint 1.1.1** (2026-05-03 14:47)
- Status: IN PROGRESS
- Completed: [x] Create HTML structure
- Current: Adding hero section
- Next: Insert headline and subheading text in lines 15-18
- Tokens: ~500/2500
```

### Example 2: Interrupted Work
```
**Checkpoint 1.1.2** (2026-05-03 15:33) - CREDITS RAN OUT
- Status: INCOMPLETE
- Subtasks done: 2 of 8
- Last file: frontend/html/index.html
- Last line: Line 42 - completed hero section
- Current work: Was adding CTA buttons
- Next step: Add button HTML at line 43 with class="cta-button"
- Code NOT fully tested yet
- Tokens used: 1800/2500
```

### Example 3: Blocked
```
**Checkpoint 1.2.1** (2026-05-03 16:15) - BLOCKED
- Status: BLOCKED
- Issue: Form validation logic needs email validation regex
- Waiting for: Clarification on email format requirements
- Resume when: Spec is clarified
- Files edited: frontend/js/form.js (partial)
```

---

## 🔗 FILE LOCATIONS TO CHECK

When resuming, verify these files exist and are updated:

```
frontend/
├── html/
│   ├── index.html ..................... Home Page
│   ├── evaluate.html .................. Evaluate Page
│   ├── challenges.html ................ Challenges Page
│   ├── about.html ..................... About Page
│   ├── pricing.html ................... Pricing Page
│   ├── contact.html ................... Contact Page
│   ├── privacy.html ................... Privacy Page
│   └── terms.html ..................... Terms Page
├── css/
│   └── style.css ....................... All styling
└── js/
    └── script.js ....................... All interactivity

backend/
└── [To be created during Phase 4]

TASK_TRACKER.md ......................... THIS FILE (your state machine)
```

---

## 📞 QUICK RESUME CHECKLIST

Before resuming work, check:

- [ ] I read TASK_TRACKER.md
- [ ] I found the correct task
- [ ] I identified the last checkpoint
- [ ] I know which file to open
- [ ] I know which line to go to
- [ ] I know what the NEXT step is
- [ ] I marked the subtask (if complete) with `[x]`
- [ ] I understand why I stopped (credits? complete subtask? dependency?)

---

## 🎯 FINAL REMINDER

**This system only works if EVERY AI agent:**

1. ✅ Reads TASK_TRACKER.md FIRST before working
2. ✅ Updates it every 30 min or 2-3 subtasks
3. ✅ Saves state BEFORE moving to a new task
4. ✅ Resumes from checkpoint, never from scratch
5. ✅ Marks subtasks [x] when complete

**Credits are expensive. Time is valuable. Checkpoints are your friend.**

---

**Created:** 2026-05-03  
**Last Reviewed:** 2026-05-03  
**Status:** ACTIVE
