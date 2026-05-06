# 🔖 CHECKPOINT TEMPLATE - Copy & Paste

**Use this template to quickly create checkpoints every 30 minutes**

---

## TEMPLATE: Standard Checkpoint (Copy Below)

```
**Checkpoint [TASK_ID].[NUMBER]** (YYYY-MM-DD HH:MM)
- **Status:** IN PROGRESS
- **Subtasks Completed:** X of Y
- **Last File Modified:** path/to/file.ext
- **Last Line:** X (or range X-Y)
- **Current Work:** [What you were doing]
- **Completed Just Now:** [x] Subtask 1, [x] Subtask 2
- **Next Step:** [Exact instruction for resuming]
- **Blocking Issues:** None
- **Tokens Used:** ~X/Y
```

---

## EXAMPLE 1: After Completing Subtask

```
**Checkpoint 1.1.1** (2026-05-03 14:30)
- **Status:** IN PROGRESS
- **Subtasks Completed:** 1 of 8
- **Last File Modified:** frontend/html/index.html
- **Last Line:** 25-35
- **Current Work:** Created semantic HTML structure
- **Completed Just Now:** [x] Create HTML structure with semantic markup
- **Next Step:** Add hero section with headline at line 36
- **Blocking Issues:** None
- **Tokens Used:** ~500/2500
```

---

## EXAMPLE 2: Credits Running Out

```
**Checkpoint 1.1.2** (2026-05-03 15:45) - CREDITS RUNNING OUT
- **Status:** IN PROGRESS (INCOMPLETE)
- **Subtasks Completed:** 2 of 8
- **Last File Modified:** frontend/html/index.html
- **Last Line:** 45
- **Current Work:** Adding hero section headline and subheading
- **Completed Just Now:** [x] Add hero section with headline & subheading
- **Next Step:** Add "How It Works" section starting at line 46 with 3 steps
- **Blocking Issues:** None - ready to resume immediately
- **Tokens Used:** 1800/2500 (STOPPED HERE - 700 tokens remaining)
```

---

## EXAMPLE 3: Blocked (Waiting)

```
**Checkpoint 1.4.1** (2026-05-03 16:20) - BLOCKED
- **Status:** BLOCKED
- **Subtasks Completed:** 1 of 7
- **Last File Modified:** frontend/html/about.html
- **Last Line:** 20
- **Current Work:** Wrote founder story section
- **Completed Just Now:** [x] Write founder story section (200-300 words)
- **Next Step:** Add problem statement (WAITING FOR CONTENT)
- **Blocking Issues:** Need founder's background details - request from stakeholder
- **Tokens Used:** ~600/1500
```

---

## EXAMPLE 4: Task Completed

```
**Checkpoint 1.1.8** (2026-05-03 17:00) - COMPLETED ✓
- **Status:** COMPLETED
- **Subtasks Completed:** 8 of 8
- **Last File Modified:** frontend/css/style.css
- **Last Line:** 120
- **Current Work:** N/A - Task complete
- **All Completed:** [x] All 8 subtasks
- **Next Step:** Move to Task 1.2 (Evaluate Page)
- **Blocking Issues:** None
- **Tokens Used:** 2400/2500
```

---

## QUICK COPY-PASTE CHECKLIST

When creating checkpoint, verify:

- [ ] Task ID and number (e.g., 1.1.2)
- [ ] Current timestamp (YYYY-MM-DD HH:MM)
- [ ] Status: IN PROGRESS / COMPLETED / BLOCKED
- [ ] Subtasks count (X of Y)
- [ ] Filename with path (e.g., frontend/html/index.html)
- [ ] Line number or range (e.g., 45 or 45-67)
- [ ] What you just did
- [ ] Subtasks you checked off [x]
- [ ] Next step (be specific!)
- [ ] Any blockers? (Usually "None")
- [ ] Tokens used so far

---

## 30-MINUTE RITUAL

```
EVERY 30 MINUTES:
1. Stop your work (1 sec)
2. Note file name & line number (5 sec)
3. Copy template above (10 sec)
4. Fill in the blanks (30 sec)
5. Paste into TASK_TRACKER.md (20 sec)
6. Save TASK_TRACKER.md (5 sec)
7. Resume work (1 sec)

Total time: ~1.5 minutes
Benefit: If credits run out, 0 wasted work
```

---

## WHERE TO PASTE

In **TASK_TRACKER.md**, find your task section:

```
### TASK 1.1: Home Page (`/`)
...task details...

**Checkpoint History:**
- **Checkpoint 1.1.0** (2026-05-03 00:00) - Task created
- [PASTE YOUR NEW CHECKPOINT HERE]
```

---

## COMMON MISTAKES TO AVOID

❌ **Wrong:** "Line ~45" or "Around line 50"
✅ **Right:** "Line 45" or "Lines 45-67"

❌ **Wrong:** "Next: Keep working on hero section"
✅ **Right:** "Next: Add CTA button HTML at line 46"

❌ **Wrong:** "Status: Working"
✅ **Right:** "Status: IN PROGRESS"

❌ **Wrong:** Leaving status blank
✅ **Right:** Status: IN PROGRESS / COMPLETED / BLOCKED

---

## FOR FAST CHECKPOINTS

**Minimal version (when in a hurry):**
```
**Checkpoint 1.1.2** (2026-05-03 15:30)
- Last file: frontend/html/index.html, line 45
- Next: Add "How It Works" section at line 46
- Status: IN PROGRESS
- Tokens: ~800/2500
```

**This still saves you from credit waste!**

---

## AUTOMATED NOTE FOR AI AGENTS

When you're getting low on credits, use this template:

```
**Checkpoint [TASK].[NUMBER]** (YYYY-MM-DD HH:MM) - CREDITS RUNNING OUT
- **Status:** IN PROGRESS
- **Last File:** [path - CRITICAL]
- **Last Line:** [number - CRITICAL]
- **Next Step:** [Exact action - CRITICAL]
- **Tokens Used:** [X/Y - CRITICAL]
```

The three CRITICAL fields let any future agent resume instantly.

---

**Last Updated:** 2026-05-03  
**Usage:** Copy template, fill in, paste into TASK_TRACKER.md  
**Frequency:** Every 30 minutes or 2-3 subtasks
