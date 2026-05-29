# Task Rules

> These are not suggestions. The task system is the only way work exists officially at MarketX.

---

## The Golden Rule

**If it isn't in Notion, it isn't happening.**

No task = no work. No work = no delivery. Saying "I'm working on it" without a task card is not acceptable.

---

## Task Lifecycle

```
Idea → Backlog → Assigned → In Progress → Review → Done
```

Nothing skips a stage. Nothing moves backward without a written reason.

---

## Every Task Must Have

| Field | Rule |
|---|---|
| **Title** | Clear action verb — "Build seller dashboard stats API", not "Dashboard stuff" |
| **Owner** | One named person — not a team, not "TBD" |
| **Priority** | P0 / P1 / P2 / P3 |
| **Status** | Current stage in the lifecycle |
| **Deadline** | Specific date — not "this week" or "ASAP" |
| **Deliverable** | One sentence on what done looks like |
| **Team** | Engineering / Ops / Growth |

---

## Priority Definitions

| Priority | Meaning | Response |
|---|---|---|
| **P0** | Blocks launch or breaks production | Drop everything — fix today |
| **P1** | MVP critical — needed before validation | Current sprint |
| **P2** | Post-validation — important but not urgent | Next sprint or backlog |
| **P3** | Future / nice to have | Backlog — review quarterly |

---

## Task Creation Rules

1. Only the CEO can create P0 and P1 tasks
2. Team leads can create P2 and P3 tasks — CEO must approve before work starts
3. A task must exist in Notion BEFORE a GitHub branch is opened
4. Branch naming: `[notion-task-id]/short-description` (e.g. `MX-42/seller-dashboard-api`)
5. PR description must reference the Notion task ID

---

## Status Rules

| Status | What it means | Who updates it |
|---|---|---|
| `Backlog` | Not yet assigned | CEO |
| `Planned` | Assigned to a sprint | CEO |
| `In Progress` | Work has started | Assignee — update same day work begins |
| `Review` | PR open or deliverable submitted | Assignee |
| `Done` | Merged, shipped, or confirmed complete | CEO or lead |
| `Blocked` | Cannot proceed — blocker must be named | Assignee — escalate same day |

---

## Engineering-Specific Rules

- No commit to `main` without a pull request
- PR must pass review before merge — no self-merges on shared features
- Hotfixes (P0) may be merged by CEO approval only, skipping normal review if time-critical
- All environment variable changes must be documented in the Engineering Docs

---

## Ops-Specific Rules

- Esther is responsible for keeping all task statuses current
- Any task not updated for 48 hours triggers a check-in
- Clockify time entries must reference the Notion task ID in the description

---

## Growth-Specific Rules

- No content published without a task card that has CEO approval noted
- Design files must be submitted to the shared brand folder before the task is marked Done
- Content tasks include a "Published URL" field — filled before Done status is set

---

## What Happens When Rules Are Broken

| Violation | Action |
|---|---|
| Work started without a task card | Task created retrospectively, flagged in performance notes |
| Status not updated for 48+ hours | Check-in by Esther, escalated to CEO if no response |
| Branch opened without Notion task | PR rejected until task is created |
| Deadline missed without prior notice | Written reason required, logged in performance notes |
| Three consecutive misses on same task | Performance review triggered |
