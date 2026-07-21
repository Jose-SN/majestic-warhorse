# Majestic Warhorse — User Workflow Guide

**Audience:** End users, management, and stakeholders (non-technical)  
**Purpose:** Clear product journey for presentations, training decks, and onboarding docs  
**Product:** Majestic Warhorse — a customizable learning platform for organizations, teachers, and students

---

## How to use this document (for PowerPoint / deck tools)

Use this file as the **source prompt** to generate a presentation. Suggested structure:

1. Title & mission  
2. Who we serve (churches, Sunday schools, schools, communities)  
3. Gold vision (end product)  
4. What MVP / Beta includes today  
5. Who uses the platform (3 login types)  
6. First-time user journey  
7. Organization / Teacher / Student journeys  
8. End-to-end story  
9. Roadmap (Version 1 → 4)  
10. Summary for management  

**Tone:** Simple language. No APIs, databases, or technical terms.  
**Visual tip:** One role = one color. One step = one slide or one numbered box.

---

## 0. Mission & who we serve

Majestic Warhorse helps groups move **learning online** — without losing their own identity.

### Primary end users (now and later)

| Audience | Example use |
|----------|-------------|
| **Churches** | Members, classes, discipleship programs |
| **Sunday schools** | Weekly lessons, teachers, children / youth classes |
| **Schools & academies** | Courses, teachers, students |
| **Communities** | Local learning groups and shared education programs |

The product is built to feel like **their** product: their name, their logo, their language, their people — powered by **our software**.

### What “customizable” means

Organizations can make the platform their own:

- **Their logo** and visual identity  
- **Their naming** (school name, program names, labels)  
- **Their brand** across the experience  
- **Their database** when they have one — or **ours** when they do not  

**End goal:** Deliver a friendly, self-serve, white-label learning system. Churches and similar groups run it as their own online school. We provide the software; they keep the identity. If they bring their own data systems, we connect; if not, we host securely for them.

---

## 0b. Gold vision — the end product

Today’s build is an **MVP / Beta foundation**. The **gold vision** (full product) is larger:

### Learning that understands people

The platform should help organizations and teachers **see each learner clearly**:

- What students are **interested** in  
- What they are **thinking** / how they respond  
- Where they are **strong**  
- Where they are **lacking** or stuck  

### Individual validation & guidance

For each person, the system (and teachers) can:

- **Validate** progress individually  
- Highlight **gaps** (“here is where you need to improve”)  
- **Suggest** next steps for students  
- Guide **teachers** on who needs attention and on what topics  

### Friendly monetization & sustainability (later)

Help organizations understand engagement and growth in a responsible way — including how programs perform and how to sustain them (plans, memberships, or premium options over time).

### Fully customizable & protective

- White-label experience (logo, naming, identity)  
- Option for customer-owned data vs hosted data  
- Still **our software** underneath — secure, consistent, improvable  

> **Presentation line:** “We move Sunday school and community learning online — branded as theirs, powered by us, smart enough to show where each learner needs to grow.”

---

## 0c. What we have built so far (MVP / Beta)

This document describes the **application as it works today** for the MVP / Beta product. If the app changes, update this section.

### In the application now

| Area | In the app today |
|------|------------------|
| **Login & sign-up** | Organization or Individual (Teacher / Student); email/password; **Continue with Google** |
| **After login** | Organization → Dashboard; Teacher / Student may go to **Waiting for approval** until approved |
| **Approvals** | Organization opens **Approvals** and approves pending teachers and students |
| **Directory** | Organization manages **Teachers** and **Students** lists |
| **Invite** | Organization can invite teachers and students (invite screens in the app) |
| **Assignments** | From a teacher or student profile, link **students ↔ teachers** (a teacher can have many students) |
| **Courses** | Teachers and organizations can **upload / list courses**; listing follows role rules (org / teacher / student — see Course listing rules) |
| **Questions** | On a course, teachers add questions (**Questionnaire**) |
| **Answers** | Students open **Assessment**, answer questions, and submit |
| **Feedback** | Teachers open **Answers**, review submissions, grade, and give feedback |

### Course listing rules (MVP — in the app)

| Role | What appears in Courses |
|------|-------------------------|
| **Organization** | All courses in the org via `organization_id` — **public + private** (org-created and teacher-created). |
| **Teacher** | All courses in the org via `organization_id`, then keep **public** courses plus **my** courses (**public + private**). |
| **Student** | 1) Courses from **assigned teachers** (student feed) — **public + private**. 2) All **public** courses in the org via `organization_id` + `access=public`. |

### Not in the MVP application yet (later)

| Area | Status |
|------|--------|
| **Plans / Premium purchase** | Not built yet — only a future “Upgrade” teaser; billing comes later |
| **Organization course approval queue** | Not a separate approval screen yet — courses are created and listed; formal org “approve course” comes later |
| **White-label** (their logo, naming, own database) | Gold vision — later versions |
| **Smart “where to improve” insights** | Gold vision — later versions |

**How we grow:** Keep the MVP loop solid → then **Version 1, 2, 3, 4** (see Roadmap). When features ship, update this document to match the application.

---

## 1. What Majestic Warhorse is (today’s product)

Majestic Warhorse is a **learning platform** where:

- An **Organization** runs a church program, Sunday school, school, or community academy  
- **Teachers** create and manage courses  
- **Students** learn, complete courses, and answer questions  

Everyone signs in with their own account. Access depends on **who you are** and whether the **organization has approved** you.

---

## 2. How many logins do we have?

There are **three login types**:

| Login type | Who it is for | What they mainly do |
|------------|---------------|---------------------|
| **Organization** | Church / school / community admin | Approve people, manage teachers & students, oversee courses and assignments |
| **Teacher** | Instructors (individual accounts) | Create courses, set questions, review answers, give feedback |
| **Student** | Learners (individual accounts) | Take assigned courses, answer questions, wait for teacher review |

**Important:** Teachers and students use an **individual login**. They do **not** use the organization login. The organization only **approves** them and manages the school or program.

---

## 3. When a new user arrives — high-level journey

```
1. Create account (sign up)
        ↓
2. Choose account type
   • Organization  OR
   • Individual (then Student or Teacher)
        ↓
3. Log in
        ↓
4a. Organization → goes to Organization Dashboard
4b. Teacher / Student → may see “Waiting for approval”
        ↓
5. After organization approval → full access for that role
```

### Sign-up choices (simple)

- **Organization** — create a school / church / community account → land on the organization dashboard  
- **Individual → Student** — join as a learner → wait for organization approval  
- **Individual → Teacher** — join as an instructor → wait for organization approval  

Optional: **Continue with Google** is available as a recommended sign-up / sign-in option.

---

## 4. Organization workflow

### 4.1 Create organization account

1. Go to **Create Account**  
2. Select **Organization**  
3. Enter organization details, contact info, and password  
4. Submit → account is created  
5. User is taken to the **Organization Dashboard**

### 4.2 Plans / premium (not in MVP — later)

Plans and purchase are **not in the Beta application yet**. Later, organizations will:

1. See available **plans** (e.g. Premium)  
2. **Purchase / select a plan**  
3. Unlock extra management features  

> **Presentation note:** Label clearly as **Coming later** — do not present as available in MVP.

### 4.3 What the organization uses in the app (MVP)

| Area in the app | Purpose |
|-----------------|---------|
| **Dashboard** | Overview of the organization |
| **Approvals** | Teachers and students waiting to be accepted — approve them here |
| **Directory → Teachers** | Approved instructors; manage who they teach |
| **Directory → Students** | Approved learners; manage which teachers they learn with |
| **Courses** | See and manage course content in the school |
| **Invite Teacher / Invite Student** | Add people to the organization |

### 4.4 Organization day-to-day actions (MVP)

1. **Approve people**  
   - Open **Approvals**  
   - Review pending teachers and students  
   - Approve them so they can use the platform  

2. **Manage teachers & students**  
   - Use **Directory** to see approved people  
   - **Invite** teachers or students when needed  

3. **Assign people**  
   - Open a teacher or student and assign links  
   - A teacher can have **multiple students**; a student can be linked to teacher(s)  

4. **Courses**
   - Browse all courses in the organization via `organization_id` (public + private)
   - Includes org-created and teacher-created courses
   - Formal “approve each course before publish” is **later** — not a separate MVP step

### 4.5 Organization success path (MVP slide)

```
Create org account
    → Dashboard
    → Approve teachers & students (Approvals)
    → Invite / manage people (Directory)
    → Assign students ↔ teachers
    → Courses available for learning
    → School / program is running
```

*(Select plan / white-label / course-approval queue = later versions)*

---

## 5. Teacher workflow

### 5.1 Who the teacher is

- Teachers use an **individual account** (not the organization login)  
- They belong to an organization (school)  
- They must be **approved by the organization** before full teaching tools unlock  

### 5.2 Teacher first-time journey

1. Create account as **Individual → Teacher** (or log in if already registered)  
2. Select / join the **organization**  
3. Status becomes **Waiting for approval**  
4. Organization admin approves the teacher  
5. Teacher can now use the full teacher experience  

### 5.3 What teachers can do after approval (MVP)

| Step | Action in the app |
|------|-------------------|
| 1 | **Add courses** — upload / create learning content (public or private) |
| 2 | **List courses** — org courses via `organization_id` (keep public + my public/private) |
| 3 | **Add questions** — Questionnaire tab on a course |
| 4 | **Review student answers** — Answers tab on a course |
| 5 | **Give feedback** — grade and write feedback on submissions |
| 6 | **Work with students** — via Directory / assigned students |

While **pending**, teacher navigation stays limited until the organization approves them.

### 5.4 Teacher flow (simple diagram)

```
Sign up / Log in (Individual – Teacher)
        ↓
Waiting for organization approval
        ↓
Approved
        ↓
Create & list courses
        ↓
Add questions
        ↓
Students submit answers
        ↓
Validate answers + give feedback
```

### 5.5 Teacher notes for management

- One teacher can have **many students**  
- Teachers only fully operate after **organization approval**  
- Course quality and student progress are visible through questions, answers, and feedback  

---

## 6. Student workflow

### 6.1 Who the student is

- Students use an **individual account**  
- They join an organization  
- They must wait for **organization approval** before learning starts  

### 6.2 Student first-time journey

1. Create account as **Individual → Student** (or log in)  
2. Select / join the **organization**  
3. Status becomes **Waiting for approval**  
4. Organization admin approves the student  
5. Organization (or school process) assigns the student to one or more **teachers**  
6. Student can view those teachers’ **courses**  

### 6.3 What students can do after approval (MVP)

| Step | Action in the app |
|------|-------------------|
| 1 | Learn once linked to teacher(s) — otherwise may still wait for assignment |
| 2 | Open **Courses** from assigned teachers (public + private) **and** org **public** courses (`organization_id` + `access=public`) |
| 3 | Complete course content |
| 4 | Open **Assessment** / questions on the course |
| 5 | **Submit answers** |
| 6 | Teacher reviews and can leave **feedback** (student can see review outcome when available) |

While **pending** (or with no teacher assigned yet), student access stays limited.

### 6.4 Student flow (simple diagram)

```
Sign up / Log in (Individual – Student)
        ↓
Waiting for organization approval
        ↓
Approved
        ↓
Assigned to teacher(s)
        ↓
View teacher courses
        ↓
Complete courses + answer questions
        ↓
Wait for teacher approval / feedback
```

---

## 7. End-to-end story (all roles together)

Use this as the **main workflow slide** for management — this matches the **MVP application**:

```
                    ORGANIZATION
                           |
           Creates account → Dashboard
                           |
         Approves teachers & students (Approvals)
                           |
         Assigns students ↔ teachers (Directory manage)
                          / \
                         /   \
                    TEACHER   STUDENT
                       |         |
              Create courses   See assigned courses
              Add questions    Complete learning
              Review answers   Submit answers
              Give feedback ←—— Teacher review
```

### Story in one paragraph

A church, Sunday school, school, or community creates an **organization account** and reaches its dashboard. Teachers and students sign up with **individual accounts** and wait on **Approvals**. Once the organization approves them and **assigns students to teachers**, teachers create **courses** and **questions**, and students study those courses, **submit answers**, and receive **teacher feedback**.

**MVP reality check:** That approval → assign → course → Q&A → feedback loop is what the Beta application delivers today. Plans/premium checkout, white-label branding, own-database options, formal org course-approval queues, and smart “where to improve” insights are **gold vision / later versions** — update this document when they ship.

---

## 8. Waiting states (easy to explain)

| Person | Waiting for | Until… | In MVP app? |
|--------|-------------|--------|-------------|
| New teacher | Organization approval | Organization approves them | Yes — Approvals + Waiting screen |
| New student | Organization approval | Organization approves them | Yes — Approvals + Waiting screen |
| Approved student with no teacher | Assignment | Org links them to a teacher | Yes — limited until assigned |
| Student answers | Teacher review | Teacher grades / feedback | Yes — Answers / feedback |
| Organization | Plan selection | Plan purchased | **Later** — not in MVP |

**Presentation tip:** Use a yellow “Waiting” badge and a green “Approved / Active” badge on slides.

---

## 8b. Application coverage checklist (keep in sync)

Use this when updating the deck or the product. **MVP = what the application does today.**

| Workflow claim | Covered in app (MVP) | Notes |
|----------------|----------------------|-------|
| 3 login types (Org / Teacher / Student) | Yes | Login + signup account type |
| Google continue | Yes | Login + signup |
| Org → dashboard after signup/login | Yes | |
| Teacher/Student waiting for approval | Yes | Approval-pending screen |
| Org Approvals for teachers & students | Yes | Approvals menu |
| Directory Teachers / Students | Yes | |
| Invite teacher / student | Yes | Invite screens in app |
| Assign students ↔ teachers | Yes | Manage from directory lists |
| Teacher create & list courses | Yes | Mine (public+private) + org public |
| Student course list | Yes | Assigned teachers (public+private) + org public |
| Organization course list | Yes | `organization_id` — all org courses (public+private) |
| Questionnaire (teacher) | Yes | Course → Questionnaire |
| Student assessment / answers | Yes | Course → Assessment |
| Teacher feedback on answers | Yes | Course → Answers |
| Plans / premium checkout | No | Later |
| Org formal course-approval queue | No | Later |
| White-label logo / naming / own DB | No | Gold vision |
| Automated improvement suggestions | No | Gold vision |

When the application gains a feature, change the matching row to **Yes** and move the story wording into the MVP sections above.

---

## 9. Slide outline (ready for PowerPoint tools)

Copy this outline into a deck generator:

1. **Title** — Majestic Warhorse User Workflow  
2. **Mission** — Move church / Sunday school / community learning online  
3. **Who we serve** — Churches, Sunday schools, schools, communities  
4. **Gold vision** — Their brand + our software; understand learners; guide improvement  
5. **MVP / Beta in the app today** — Login, approvals, directory, assign, courses, Q&A, feedback  
6. **Three logins** — Organization / Teacher / Student  
7. **New user path** — Sign up → role → login → dashboard or waiting  
8. **Organization journey (MVP)** — Approvals, Directory, assign, courses  
9. **Teacher journey (MVP)** — wait → courses → questions → feedback  
10. **Student journey (MVP)** — wait → assigned courses → answers → feedback  
11. **Full story diagram** — matches the live app loop  
12. **Coming later** — plans, white-label, insights (Versions 1–4)  
13. **Summary** — Document describes the MVP app; update when the app changes  

---

## 10. Role summary cheat sheet

| Role | Login style | First screen after signup/login | Key responsibility (MVP) |
|------|-------------|----------------------------------|--------------------------|
| Organization | Organization account | Dashboard | Approvals, Directory, assign people, courses |
| Teacher | Individual account | Waiting → then Teacher home | Courses, questions, answer review, feedback |
| Student | Individual account | Waiting → then Student home | Assigned courses, answers, receive feedback |

---

## 11. Product roadmap (gradual versions)

| Stage | Focus | Examples |
|-------|--------|----------|
| **MVP / Beta (now — in the app)** | Core school loop | Login, approvals, directory, assign, courses, questions, answers, teacher feedback |
| **Version 1** | Identity & trust | Stronger branding options, org plans / premium basics, smoother invites in nav |
| **Version 2** | White-label & data choice | Logo, naming, “make it their product”; connect customer DB or use ours |
| **Version 3** | Learner intelligence | Interests, gaps, individual validation, “where to improve” for students & teachers |
| **Version 4** | Scale for churches & communities | Sunday-school friendly packages, deeper analytics, monetization insights, self-serve setup |

Exact features per version can be refined with management — the principle is **build the loop first, then customize, then intelligently guide**. Update this document whenever a version ships in the application.

---

## 12. Key messages for management

1. **We serve churches, Sunday schools, schools, and communities** — especially groups moving classes online.  
2. **End goal:** their logo, naming, and identity — our software underneath.  
3. **Data flexibility:** their database if they have one; ours if they do not.  
4. **Gold vision:** understand each learner (interest, strength, gaps) and suggest improvement.  
5. **MVP / Beta in the app today:** login, approvals, directory, assignments, courses, Q&A, teacher feedback.  
6. **Not in MVP yet:** premium checkout, white-label, own-DB connectors, automated improvement insights, formal org course-approval queue.  
7. **Three clear audiences**, three clear journeys — and this document should stay matched to the live application.  
8. **Versions 1–4** grow branding, data options, intelligence, and church-ready packaging gradually.  

---

*Document type: User / management workflow (non-technical)*  
*Source of truth for MVP claims: the live Majestic Warhorse application*  
*Related technical reference (internal only): `UI_WORKFLOW.md`*  
*Maintenance rule: when the app changes, update Section 0c and Section 8b first.*
