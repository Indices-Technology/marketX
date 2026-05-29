# Incident Reports

> Any bug, outage, data issue, team conduct issue, or platform failure must be logged here the same day it is discovered.
> Discovering an incident and not reporting it is treated the same as causing it.

---

## Incident Types

| Type | Examples |
|---|---|
| **P0 — Critical** | Production down, payments failing, data breach, authentication broken |
| **P1 — High** | Feature broken for all users, map not loading, Dassa offline |
| **P2 — Medium** | Feature degraded, slow performance, UI bug affecting conversion |
| **P3 — Low** | Minor UI issue, copy error, non-critical broken link |
| **Team** | Conduct issue, access violation, policy breach |

---

## Response Time by Severity

| Severity | Acknowledge | Resolve | Post-mortem |
|---|---|---|---|
| P0 — Critical | Within 1 hour | Same day | Within 48 hours |
| P1 — High | Within 4 hours | Within 24 hours | Within 72 hours |
| P2 — Medium | Within 24 hours | Within current sprint | Optional |
| P3 — Low | Next standup | Next sprint | Not required |
| Team | Within 24 hours | CEO handles | As needed |

---

## Incident Template

```
### INC-[Number] — [Short Title] — [Date]

**Reported by:** [Name]
**Severity:** P0 / P1 / P2 / P3 / Team
**Type:** Production / Feature / Performance / Team Conduct
**Status:** Open / Investigating / Resolved

---

**What happened:**
[Clear description of the issue — what broke, when, and what was the impact on users]

**When it started:**
[Time and date first observed]

**Who was affected:**
[Buyers / Sellers / Admin / All users / Internal only]

**Steps to reproduce (if applicable):**
1.
2.

**Root cause:**
[Filled after investigation — what actually caused this]

**Fix applied:**
[What was done to resolve it]

**Resolved at:**
[Time and date]

**Prevention:**
[What change prevents this from happening again]

**CEO notified:** Yes / No
**Linked Notion task:** [task ID]
```

---

## Incident Log

| ID | Title | Severity | Date | Status | Owner |
|---|---|---|---|---|---|
| INC-001 | | | | | |

---

## Active Incidents

_None currently open._

---

## Resolved Incidents

---

### INC-001 — [Title] — [Date]

**Reported by:**
**Severity:**
**Type:**
**Status:** Resolved

**What happened:**

**Root cause:**

**Fix applied:**

**Resolved at:**

**Prevention:**

---

## Post-Mortem Rules

Every P0 incident requires a post-mortem within 48 hours of resolution. The post-mortem must answer:

1. What broke and why?
2. How long were users affected?
3. How was it detected — did we find it or did a user report it?
4. What slowed down the fix?
5. What specific change prevents recurrence?

Post-mortems are blameless — the goal is system improvement, not individual blame. That said, repeated incidents caused by the same person ignoring known rules will be noted in performance records.
