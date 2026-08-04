# Majestic Warhorse --- Product Requirements Document (PRD)

**Company:** PetaxAI\
**Product:** Majestic Warhorse\
**Category:** AI Learning Intelligence & Education Operating System\
**Founder / Product Architect / Technical Lead:** Joseph\
**Document Purpose:** Source of truth for product development,
architecture, AI coding agents, and engineering teams.

**Related strategy brief (pitch, market, competitors, revenue, GCSE niche,
AI Diagnostic MVP timeline):**
[05_AI_Tutor_Adaptive_Learning_Strategy.md](./05_AI_Tutor_Adaptive_Learning_Strategy.md)
— also summarised in §35 below.

------------------------------------------------------------------------

## 1. Product Vision

Majestic Warhorse is an AI-powered Learning Intelligence Platform
designed to transform education from reactive learning into continuously
adaptive, personalised, and intelligence-driven learning.

Traditional platforms answer:

> What course did the learner take?\
> Did the learner complete it?\
> What score did the learner receive?

Majestic should answer:

> **What does this learner understand, what do they misunderstand, why
> are they struggling, and what should happen next?**

Majestic is not simply an LMS, AI chatbot, assessment platform, or
analytics dashboard.

It is an **AI Learning Intelligence Platform**.

------------------------------------------------------------------------

## 2. Product Thesis

> **Traditional education systems record what learners do. Majestic aims
> to understand what learners know.**

The core product innovation is the **Learner Intelligence Engine**.

It continuously combines:

-   Learning activity
-   Assessment performance
-   AI tutor interactions
-   Repeated errors
-   Knowledge gaps
-   Behavioural signals
-   Historical progress
-   Teacher feedback

to maintain an evolving model of the learner and recommend the next best
learning intervention.

------------------------------------------------------------------------

## 3. Product Goals

### Primary Goals

1.  Build an AI tutor that optimises for learning, not merely answer
    generation.
2.  Build a dynamic, evidence-based learner intelligence profile.
3.  Detect knowledge gaps and recurring misconceptions.
4.  Personalise learning journeys.
5.  Provide teachers with actionable class intelligence.
6.  Detect performance decline early.
7.  Measure whether interventions improve outcomes.
8.  Build a GDPR/privacy-by-design foundation.
9.  Support multi-tenant SaaS deployment.
10. Create an extensible platform capable of serving schools,
    universities, training providers, and other learning organisations.

### Non-Goals for MVP

Do not initially attempt to:

-   Replace teachers.
-   Replace complete university SIS systems.
-   Make autonomous high-impact decisions about learners.
-   Fully automate career selection.
-   Build AI avatars before core learning intelligence is validated.

------------------------------------------------------------------------

# 4. Core Product Architecture

``` text
┌──────────────────────────────────────────────┐
│              EXPERIENCE LAYER                │
│ Web | Mobile | PWA | Future AI Interfaces    │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│            APPLICATION PLATFORM              │
│ Identity | Organisations | Courses | Users   │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│          LEARNING INTELLIGENCE LAYER         │
│ Learner Model | Knowledge Graph | AI Tutor   │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│            INTELLIGENCE SERVICES             │
│ Recommendations | Prediction | Assessment AI │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│                DATA PLATFORM                 │
│ Operational DB | Events | Analytics | AI Data│
└──────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 5. Target Users

## Learner

Needs:

-   Personalised learning
-   AI guidance
-   Knowledge-gap visibility
-   Practice recommendations
-   Assessment preparation
-   Progress tracking

## Teacher

Needs:

-   Class intelligence
-   Student risk identification
-   Common misconception detection
-   AI teaching assistance
-   Automated assessment support

## Parent / Guardian

Needs:

-   Meaningful progress visibility
-   Improvement areas
-   Support recommendations

Access must respect age, consent, legal authority, and organisation
policy.

## Institution Administrator

Needs:

-   User and organisation management
-   Courses and academic structures
-   Permissions
-   Data governance
-   AI policies

## Institutional Leadership

Needs:

-   Learning outcome trends
-   Cohort intelligence
-   Intervention effectiveness
-   Strategic performance insights

## Content Creator

Needs:

-   Content creation
-   AI-assisted course generation
-   Assessment generation
-   Concept tagging
-   Content effectiveness analysis

------------------------------------------------------------------------

# 6. Core Modules

## 6.1 Organisation & Tenant Management

Support multiple independent organisations on one platform.

Requirements:

-   Organisation creation
-   Organisation profile
-   Branding
-   Academic structure
-   Departments
-   Programs
-   Courses
-   Classes
-   Academic years
-   Organisation-specific policies
-   AI configuration
-   Data retention configuration

### Multi-Tenancy Principle

Every tenant-owned resource must be explicitly associated with a
tenant/organisation.

Tenant isolation must be enforced at:

``` text
UI
 ↓
API
 ↓
Application Service
 ↓
Data Access Layer
 ↓
Database
```

Never rely only on frontend filtering for tenant isolation.

------------------------------------------------------------------------

## 6.2 Identity & Access Management

Roles may include:

-   Platform Super Admin
-   Organisation Admin
-   Teacher
-   Student
-   Parent / Guardian
-   Counsellor
-   Content Creator
-   Analyst

Requirements:

-   Authentication
-   Role-based access control
-   Permission-based access control
-   Organisation isolation
-   Session management
-   MFA-ready architecture
-   Audit logs
-   Consent management

Authorisation must be enforced server-side.

------------------------------------------------------------------------

## 6.3 Learner Intelligence Profile

Each learner has a dynamic profile.

### Academic State

-   Subjects
-   Topics
-   Skills
-   Concepts
-   Historical performance
-   Assessment scores
-   Course completion

### Knowledge State

-   Mastery estimate
-   Mastery confidence
-   Knowledge gaps
-   Misconceptions
-   Prerequisite dependencies

### Behavioural State

-   Learning frequency
-   Session patterns
-   Engagement trends
-   Completion behaviour
-   Repetition patterns

### Interaction State

-   AI questions
-   Repeated confusion
-   Explanation requests
-   Tutor interaction patterns

### Progress State

-   Improvement rate
-   Declining performance
-   Learning velocity
-   Intervention outcomes

The profile must be treated as a continuously evolving model, not a
static student record.

------------------------------------------------------------------------

# 7. Learner Intelligence Engine

This is the central product capability.

Responsibilities:

1.  Collect learning evidence.
2.  Normalise evidence.
3.  Map evidence to concepts and skills.
4.  Update mastery estimates.
5.  Detect knowledge gaps.
6.  Detect misconceptions.
7.  Analyse performance trends.
8.  Generate recommendations.
9.  Measure intervention effectiveness.

------------------------------------------------------------------------

# 8. Knowledge Graph

The platform should model relationships between:

``` text
Subject
  ↓
Topic
  ↓
Skill
  ↓
Concept
  ↓
Prerequisite
  ↓
Assessment Evidence
```

Example:

``` text
Mathematics
  └── Algebra
       └── Linear Equations
            └── Negative Numbers
                 └── Prerequisite:
                     Number Operations
```

If a learner struggles with linear equations, the system should
investigate whether a prerequisite weakness is the underlying cause.

------------------------------------------------------------------------

# 9. Evidence-Based Mastery

Never rely on one score alone.

Mastery estimation should combine:

``` text
Assessment Results
        +
Practice Performance
        +
AI Conversation Evidence
        +
Repeated Errors
        +
Learning Behaviour
        +
Historical Trend
        +
Teacher Feedback
```

Example:

``` text
Topic: Algebra

Mastery: 72%
Confidence: 88%

Evidence:
- 3 assessments
- 20 practice questions
- 5 AI interactions
- 2 teacher observations
```

The system must distinguish:

-   Mastery estimate
-   Confidence in estimate
-   Evidence supporting estimate
-   Timestamp of last update

------------------------------------------------------------------------

# 10. AI Tutor

The AI tutor is a learning companion, not a generic chatbot.

It should understand:

-   Learner level
-   Current subject
-   Curriculum context
-   Known strengths
-   Known weaknesses
-   Previous mistakes
-   Current learning objective

Capabilities:

-   Explain concepts
-   Ask guiding questions
-   Give hints
-   Use Socratic questioning
-   Generate examples
-   Adapt difficulty
-   Check understanding
-   Identify misconceptions
-   Recommend practice

### Learning-First Principle

The tutor should avoid immediately providing answers when guided
learning is more appropriate.

Preferred interaction:

``` text
Learner Question
      ↓
Understand Existing Knowledge
      ↓
Ask Guiding Question
      ↓
Provide Hint
      ↓
Explain If Necessary
      ↓
Check Understanding
      ↓
Update Learner Model
```

------------------------------------------------------------------------

# 11. Personalised Learning Engine

The engine answers:

> **What should this learner do next?**

Possible actions:

-   Review prerequisite concept
-   Read a targeted lesson
-   Watch a relevant explanation
-   Attempt targeted practice
-   Ask the AI tutor
-   Complete a diagnostic assessment
-   Receive teacher intervention

Recommendation inputs:

``` text
Learning Goal
      +
Knowledge Gap
      +
Learner Ability
      +
Historical Performance
      +
Available Content
      +
Current Context
```

Every recommendation should have:

-   Reason
-   Evidence
-   Expected outcome
-   Priority
-   Completion status
-   Outcome measurement

------------------------------------------------------------------------

# 12. AI Assessment Intelligence

Supported assessment types:

-   Quizzes
-   Exams
-   Assignments
-   Practice questions
-   Diagnostic assessments

The AI should analyse not only whether an answer is wrong, but
potentially why.

Possible error classifications:

-   Conceptual error
-   Calculation error
-   Procedural error
-   Application error
-   Misreading
-   Prerequisite knowledge gap

Example:

``` text
Question:
Solve 2x + 4 = 10

Learner Answer:
x = 7

Possible Analysis:
The learner may understand addition but
does not correctly isolate the variable.
```

AI-generated assessments must be reviewable and must not automatically
be treated as authoritative for high-stakes decisions.

------------------------------------------------------------------------

# 13. Teacher Intelligence Platform

The teacher dashboard should prioritise action over data volume.

Example:

``` text
Class: Year 8 Mathematics

Topic: Fractions
Estimated Understanding: 62%

Learners Struggling: 18

Common Misconception:
Converting mixed numbers to improper fractions.

Recommended Action:
Run a 20-minute targeted intervention.

Priority Learners:
8
```

Teacher intelligence should answer:

> What is happening?

> Why is it happening?

> Which learners need attention?

> What action is recommended?

> Did the intervention work?

------------------------------------------------------------------------

# 14. Predictive Intelligence

Potential predictions:

-   Performance decline
-   Engagement decline
-   Assessment difficulty
-   Dropout risk
-   Learning difficulty

Predictions must be:

-   Explainable
-   Confidence-scored
-   Evidence-backed
-   Auditable
-   Human-reviewed where appropriate

Never represent a prediction as a fact.

Preferred:

``` text
Risk Level: High

Evidence:
- Attendance declined
- Assignment completion declined
- Assessment performance declined

Recommended Action:
Teacher check-in and targeted revision.
```

Avoid:

``` text
The learner will fail.
```

------------------------------------------------------------------------

# 15. Intervention Intelligence

Majestic should eventually learn which interventions work.

Flow:

``` text
Signal
  ↓
Detection
  ↓
Explanation
  ↓
Recommendation
  ↓
Human Action
  ↓
Intervention
  ↓
Outcome Measurement
```

Future intelligence:

> Which intervention works for which learner, in which subject, under
> which conditions?

This can become a significant long-term product moat.

------------------------------------------------------------------------

# 16. Parent / Guardian Portal

Parent views should be meaningful and limited.

Example:

``` text
Improving:
✓ Reading comprehension

Needs support:
⚠ Mathematics problem solving

Recent Trend:
Improvement over the last 4 weeks

Suggested Support:
30 minutes of targeted practice
```

Parent access must be controlled by:

-   Consent
-   Age
-   Legal authority
-   Organisation policy
-   Data protection requirements

Do not expose all learner data or AI conversations by default.

------------------------------------------------------------------------

# 17. Content Intelligence Platform

Content types:

-   Courses
-   Lessons
-   Videos
-   Documents
-   Notes
-   Questions
-   Assessments
-   Interactive learning materials

AI capabilities:

-   Summarisation
-   Concept extraction
-   Content tagging
-   Question generation
-   Difficulty estimation
-   Prerequisite mapping
-   Content recommendation

Long-term model:

``` text
Content
  ↓
Concepts
  ↓
Skills
  ↓
Learning Outcomes
```

------------------------------------------------------------------------

# 18. Career & Skill Intelligence

Future capability:

``` text
Learner
  ↓
Skills
  ↓
Interests
  ↓
Performance
  ↓
Career Paths
  ↓
Required Skills
  ↓
Recommended Learning Journey
```

Career intelligence should be guidance, not deterministic
decision-making.

------------------------------------------------------------------------

# 19. Event-Driven Learning Data

Learning events should be captured as first-class data.

Examples:

``` text
lesson_started
lesson_completed
quiz_attempted
question_answered
ai_question_asked
concept_explained
recommendation_accepted
recommendation_completed
assessment_submitted
teacher_intervention_created
intervention_completed
```

Example event:

``` json
{
  "event": "quiz_question_answered",
  "learner_id": "...",
  "concept_id": "...",
  "result": "incorrect",
  "timestamp": "...",
  "context": {
    "course_id": "...",
    "assessment_id": "..."
  }
}
```

The event system should be designed so new intelligence features can
consume historical learning events without tightly coupling analytics to
transactional workflows.

------------------------------------------------------------------------

# 20. AI Architecture

AI must be isolated behind an orchestration layer.

``` text
Application API
      ↓
AI Orchestration Layer
      ↓
┌──────────────────────┐
│ Context Builder       │
│ Prompt Manager        │
│ Model Router          │
│ Safety Layer          │
│ Output Validator      │
│ Evaluation Layer      │
└──────────┬───────────┘
           ↓
        AI Models
```

Requirements:

-   Provider abstraction
-   Model routing
-   Cost optimisation
-   Context management
-   Prompt versioning
-   Output validation
-   AI evaluation
-   Safety policies
-   Usage monitoring

Do not tightly couple the core product to a single AI provider.

------------------------------------------------------------------------

# 21. Retrieval-Augmented Generation

Educational AI responses should be grounded in authorised knowledge
where appropriate.

Flow:

``` text
User Question
      ↓
Learner Context
      ↓
Authorised Content Retrieval
      ↓
Curriculum Context
      ↓
AI Model
      ↓
Output Validation
      ↓
Response
```

The system must distinguish between:

-   General AI knowledge
-   Organisation content
-   Course content
-   Teacher-provided material
-   Learner-specific information

Access permissions must apply to retrieval.

------------------------------------------------------------------------

# 22. Data Architecture

## Operational Data

Recommended primary database:

-   PostgreSQL

Suitable for:

-   Users
-   Organisations
-   Courses
-   Enrolments
-   Assessments
-   Permissions
-   Learning records

## Event Data

Store learning events separately from core transactional entities where
appropriate.

## Analytics

The architecture should allow future separation of:

``` text
Operational Database
        ↓
Event Stream / Event Store
        ↓
Analytics Processing
        ↓
Feature Store / ML Data
        ↓
Intelligence Services
```

Do not prematurely build a complex data lake before actual scale and
data requirements justify it.

------------------------------------------------------------------------

# 23. Multi-Tenant SaaS Architecture

Base model:

``` text
One Platform
      ↓
Many Organisations
      ↓
Many Users
      ↓
Many Learning Environments
```

Requirements:

-   Strong tenant isolation
-   Organisation-specific configuration
-   Organisation-specific content
-   Organisation-specific AI knowledge
-   Organisation-specific branding
-   Organisation-specific data policies

Future enterprise options:

``` text
Shared Application
Dedicated Database
Dedicated Data Region
```

------------------------------------------------------------------------

# 24. API Domains

The API should be modular and versioned.

Suggested domains:

``` text
/api/v1/auth
/api/v1/organisations
/api/v1/users
/api/v1/learners
/api/v1/courses
/api/v1/content
/api/v1/assessments
/api/v1/ai
/api/v1/recommendations
/api/v1/analytics
/api/v1/interventions
```

Requirements:

-   Versioning
-   Authentication
-   Authorisation
-   Input validation
-   Rate limiting
-   Audit logging
-   Consistent error responses

------------------------------------------------------------------------

# 25. Privacy and GDPR-by-Design

Privacy is a product architecture principle.

Requirements:

-   Data minimisation
-   Purpose limitation
-   Consent management
-   Data access
-   Data export
-   Data deletion
-   Retention controls
-   Audit logging
-   Encryption
-   Tenant isolation
-   Role-based access
-   AI data governance

The platform should allow organisations to define:

``` text
What data is collected?
Why is it collected?
Who can access it?
How long is it retained?
How is it used by AI?
```

Core principle:

> **Learner data should be used to improve learning, not exploit learner
> data.**

------------------------------------------------------------------------

# 26. AI Safety

Required capabilities:

-   Age-appropriate responses
-   Content moderation
-   Prompt injection protection
-   Sensitive-data controls
-   Output validation
-   Human escalation
-   Auditability

High-impact AI outputs should provide:

``` text
Prediction
   ↓
Evidence
   ↓
Confidence
   ↓
Recommended Action
```

------------------------------------------------------------------------

# 27. MVP Scope

The MVP should validate the core innovation.

## Organisation

-   Organisation creation
-   User management
-   Role-based access
-   Basic tenant isolation

## Learner

-   Learner profile
-   Course enrolment
-   Learning activity tracking
-   Performance history

## Content

-   Courses
-   Lessons
-   Documents
-   Quizzes

## AI

-   AI tutor
-   Course-aware responses
-   Learner-context-aware responses
-   Guided learning mode

## Intelligence

-   Basic mastery model
-   Knowledge-gap detection
-   Personalised recommendations

## Teacher

-   Class dashboard
-   Learner performance
-   Weak-topic analysis

## Data

-   Learning event tracking
-   Audit logs
-   Consent foundation

------------------------------------------------------------------------

# 28. MVP Learner Journey

``` text
Create Account
      ↓
Join Organisation
      ↓
Complete Diagnostic Assessment
      ↓
Initial Learner Model
      ↓
Personalised Learning Path
      ↓
Learn
      ↓
Ask AI Tutor
      ↓
Practice
      ↓
Assessment
      ↓
Learner Model Updated
      ↓
Next Recommendation
```

------------------------------------------------------------------------

# 29. Example End-to-End Scenario

Sarah is learning mathematics.

### Assessment

``` text
Algebra: 78%
Geometry: 44%
```

### Intelligence

The system identifies:

``` text
Weak Area:
Geometry

Recurring Issue:
Applying formulas to real-world problems
```

### AI Tutor

Sarah asks:

> I don't understand this problem.

The AI tutor uses:

-   Her current level
-   Previous mistakes
-   Known knowledge gaps
-   Current learning objective

The AI provides guided help instead of immediately giving the answer.

### Targeted Practice

Sarah completes recommended exercises.

### Outcome

``` text
Geometry:
44% → 61% → 73%
```

### Updated Intelligence

The learner model updates and generates the next recommendation.

This creates a continuous learning loop:

``` text
Learn
  ↓
Interact
  ↓
Assess
  ↓
Understand
  ↓
Recommend
  ↓
Learn Again
```

------------------------------------------------------------------------

# 30. Product Metrics

## Learner

-   Knowledge improvement
-   Assessment improvement
-   Time to mastery
-   Recommendation acceptance
-   Recommendation completion
-   Intervention success

## AI Tutor

-   Learning outcome after interaction
-   Repeated confusion rate
-   Tutor usefulness
-   Hallucination rate
-   Escalation rate

## Teacher

-   Time saved
-   Intervention completion
-   Recommendation usefulness
-   Teacher adoption

## Institution

-   Learning outcome improvement
-   Early intervention effectiveness
-   Engagement
-   Retention
-   Cohort improvement

### North Star Metric

> **Measured improvement in learner outcomes.**

Do not optimise primarily for:

-   Number of AI messages
-   Time spent in the app
-   Number of generated responses

------------------------------------------------------------------------

# 31. Product Moat

Long-term defensibility should come from the combination of:

1.  Dynamic Learner Intelligence Model
2.  Knowledge Graph
3.  Evidence Engine
4.  Personalised Recommendation Engine
5.  Intervention Intelligence
6.  Organisation-Specific Intelligence
7.  Privacy Architecture
8.  Accumulated Outcome Data

The strongest future moat is:

> **Understanding which learning interventions actually improve outcomes
> for different types of learners.**

------------------------------------------------------------------------

# 32. Scalability Roadmap

## Phase 1 --- Learning Intelligence MVP

-   Learner
-   AI Tutor
-   Courses
-   Assessments
-   Knowledge Gaps
-   Recommendations

## Phase 2 --- Educator Intelligence

-   Teacher Copilot
-   Class Intelligence
-   Intervention Workflows

## Phase 3 --- Institution Intelligence

-   Predictive Analytics
-   Cohort Intelligence
-   Institution Dashboards
-   External Integrations

## Phase 4 --- Learning Ecosystem

-   Content Providers
-   Career Intelligence
-   Skills Marketplace
-   Public APIs
-   AI Agents

------------------------------------------------------------------------

# 33. Product Principles

## Understand Before Recommending

The system should understand the learner before recommending content.

## Evidence Before Prediction

Predictions must be supported by observable evidence.

## Learning Over Answers

The AI tutor should optimise for understanding.

## Human Educators Remain in the Loop

AI augments educators.

## Privacy by Design

Privacy must be designed into the product and architecture.

## Modular and Scalable Architecture

The system should evolve without requiring a complete rewrite.

## Outcome Over Activity

The platform should measure improvement, not merely usage.

------------------------------------------------------------------------

# 34. Founder and Technical Leadership

The Founder, Joseph, is responsible for:

### Product

-   Product vision
-   Innovation strategy
-   Product roadmap
-   Market direction

### Architecture

-   System architecture
-   AI architecture
-   Data architecture
-   Scalability
-   Security
-   Multi-tenancy

### Technical Leadership

-   Engineering standards
-   Technical roadmap
-   Code quality
-   Team leadership
-   AI implementation
-   Infrastructure decisions

The founder's role is to convert the product thesis into a scalable
technology platform.

------------------------------------------------------------------------

# 35. Adaptive Learning Intelligence — Strategy Brief (canonical detail)

**Canonical full brief:** [05_AI_Tutor_Adaptive_Learning_Strategy.md](./05_AI_Tutor_Adaptive_Learning_Strategy.md)

This section embeds the strategy-meeting essentials so the PRD is complete
without opening a second file. Prefer the linked doc for competitors,
pricing tables, journey diagrams, and codebase gap mapping.

### One-line pitch

An AI tutor that automatically discovers each learner’s strengths and
weaknesses, generates a personalized learning path, and continuously
adapts recommendations based on performance.

### Business problem (summary)

Students receive the same lessons regardless of understanding. Teachers
and providers struggle to identify gaps early, track individual progress,
personalize plans, give timely feedback, and scale support — so students
restudy known material while hidden weaknesses persist.

### Target customers

- **Primary:** Schools; colleges and universities; coaching centers;
  online learning platforms; corporate training teams.
- **Secondary:** Parents of school students; individual exam learners;
  professional certification candidates.

### Competitors (named)

Khan Academy, Duolingo, Coursera (limited personalization), Quizlet,
Century Tech, Squirrel AI, BYJU’S.

### Market gap

Most platforms ship content and quizzes on predefined paths. Few
continuously diagnose conceptual weaknesses, explain *why* the learner
struggles, predict future performance, and recommend the next activity
without teacher approval.

### Proposed solution

Mobile + web app with an **AI Diagnostic Engine**: adaptive assessment →
weak-concept detection → confidence/mastery → personalized plan →
recommend courses/videos/exercises/revision → re-test until mastery.

### Example journey (GCSE-style maths illustration)

| Day | Event |
|-----|--------|
| Day 1 | 15-minute diagnostic → e.g. Algebra 82%, Fractions 41%, Word problems 35%, Geometry 76% → 7-day “Fractions Recovery Plan” + reminders |
| Day 7 | Fractions improve to 68%; next module unlocks — no teacher intervention required for the path |

### Core features (strategy)

AI Skill Map · Personalized Learning Path · Strength & Weakness Report
(PDF/email) · AI Tutor Chat · Predictive Performance Score · Automatic
Revision Planner (spaced repetition / forgetting curves) ·
Parent/Teacher Dashboard.

### AI stack (capability classes)

- **ML:** knowledge tracing, adaptive testing, difficulty adjustment,
  performance prediction.
- **Generative AI:** simpler explanations, practice questions,
  personalized feedback, study summaries, progress reports.
- **Analytics:** learning velocity, retention rate, engagement score,
  mastery trend.

### Technical feasibility

**Feasibility: High.** Suggested stack: Mobile Flutter/React Native;
Web Angular/React; Backend FastAPI; DB PostgreSQL; AI OpenAI/OSS LLMs;
Analytics Python/XGBoost; Hosting AWS. *(Current Majestic web SPA is
Angular; AI Mode is stubbed — see strategy doc §18.)*

### AI Diagnostic MVP timeline

| Workstream | Duration |
|------------|----------|
| Diagnostic test engine | 4 weeks |
| Personalized recommendations | 3 weeks |
| AI chat tutor | 2 weeks |
| Dashboard & reports | 3 weeks |
| **Total** | **~3 months** (small team) |

### Revenue model

- **B2C:** Free basic; Premium student **£5–£15/month**.
- **B2B:** School license **£500–£5,000/year**; coaching center license;
  corporate training license.
- **Add-ons:** Exam prep packs; AI tutoring credits; parent premium
  reports.

### Competitive advantage (positioning)

Traditional LMS: “Score: 62%.”  
Majestic direction: explain the *specific misconception*, prescribe time
on a named lesson and practice set, then gate progression — diagnostic
explanation is the differentiator.

### Initial niche

**GCSE Maths (UK)** first (clear curriculum, large base, objective
assessment, measurable improvement); expand to English, science, coding,
professional certifications.

### 12-month roadmap (GTM)

1. GCSE Maths diagnostic + recommendations  
2. AI tutor chat + predictive scoring  
3. Parent and teacher analytics  
4. Multi-subject adaptive learning  
5. Corporate and professional training version  

### Strategy meeting summary

| Item | Statement |
|------|-----------|
| Problem | Generic learning; hidden weaknesses |
| Solution | Auto-diagnose → personalize → track mastery |
| Differentiator | Diagnostic intelligence + adaptive recommendations + automated reporting |
| Business model | Freemium B2C + school licensing |
| MVP feasibility | High (≈3 months for AI diagnostic MVP) |
| Long-term vision | AI learning intelligence layer for schools, tutoring centers, and lifelong learners |

------------------------------------------------------------------------

# 36. Final Product Definition

> **Majestic Warhorse is an AI-powered Learning Intelligence and
> Education Operating System that continuously builds an evidence-based
> understanding of each learner's knowledge, performance, behaviour, and
> learning needs. It combines an adaptive AI tutor, knowledge-gap
> detection, personalised learning recommendations, intelligent
> assessment, predictive performance analytics, and educator
> intelligence to help learners improve and institutions make better
> educational decisions.**

------------------------------------------------------------------------

# 37. One-Sentence Product Positioning

> **Majestic Warhorse is a GDPR-first AI Learning Intelligence Platform
> that transforms fragmented educational data into a continuously
> evolving learner model, enabling personalised AI tutoring, early
> knowledge-gap detection, adaptive learning recommendations, and
> measurable intervention outcomes.**

------------------------------------------------------------------------

# 38. Instructions for AI Coding Agents

When modifying the codebase:

1.  Read this PRD before implementing major features. For AI tutor,
    diagnostic, personalization, pricing, GCSE niche, or GTM scope, also
    read [05_AI_Tutor_Adaptive_Learning_Strategy.md](./05_AI_Tutor_Adaptive_Learning_Strategy.md).
2.  Preserve the existing architecture unless a change is justified.
3.  Prefer modular, domain-oriented design.
4.  Keep business logic out of UI components.
5.  Enforce tenant isolation server-side.
6.  Enforce authorisation server-side.
7.  Treat learner data as sensitive.
8.  Do not expose private learner data unnecessarily.
9.  Do not hard-code AI provider-specific logic throughout the
    application.
10. Keep AI orchestration behind a clear abstraction.
11. Track important learning events.
12. Prefer explainable intelligence over opaque predictions.
13. Never introduce high-impact automated decisions without human
    oversight.
14. Write tests for business-critical logic.
15. Maintain backwards compatibility where practical.
16. Update documentation when architecture changes.
17. Avoid premature microservices unless justified by scale, team
    boundaries, or deployment requirements.
18. Prefer a modular monolith initially if it provides faster iteration
    and clear domain boundaries.
19. Treat the Learner Intelligence Engine as a core domain capability.
20. Every feature should answer: **How does this improve learning
    outcomes?**

------------------------------------------------------------------------

# 39. Architecture Decision Priority

When making technical decisions, prioritise:

1.  Learner safety and privacy
2.  Correctness of learning intelligence
3.  Data integrity
4.  Tenant isolation
5.  Explainability
6.  Scalability
7.  Maintainability
8.  Cost efficiency
9.  Developer velocity

------------------------------------------------------------------------

# 40. Core Product Thesis

> **Traditional education systems record what learners do. Majestic aims
> to understand what learners know.**

This is the central product principle that should guide the
architecture, AI systems, data model, user experience, and future
product roadmap.
