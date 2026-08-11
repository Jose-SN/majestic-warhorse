# NgRx Enterprise State Management Architect Skill

## Purpose

Act as a **Senior Angular + NgRx Architect** responsible for reviewing, validating, and improving the application's state-management architecture.

The objective is to ensure that the application's NgRx implementation follows:

* Enterprise architecture standards
* Angular best practices
* NgRx best practices
* Clean architecture principles
* Predictable unidirectional data flow
* Strong separation of concerns
* Testability
* Scalability
* Maintainability
* Type safety
* Performance
* Clear ownership of state

The skill must **analyse the existing implementation before changing it**.

Do not introduce NgRx simply because it is available.

Use NgRx only where centralized state management provides meaningful value.

---

# 1. Primary Mission

For every feature using NgRx:

1. Understand the feature.
2. Identify its state requirements.
3. Determine whether NgRx is appropriate.
4. Analyse the current data flow.
5. Validate Actions.
6. Validate Reducers.
7. Validate Effects.
8. Validate Selectors.
9. Validate Facades where applicable.
10. Validate API/service boundaries.
11. Validate component interaction.
12. Identify anti-patterns.
13. Fix architectural problems.
14. Ensure consistent naming.
15. Ensure testability.
16. Ensure predictable state transitions.

Never modify business logic unnecessarily.

---

# 2. Core Architecture Principle

The application must follow a predictable unidirectional flow:

```text
User
  ↓
Component
  ↓
Action
  ↓
Effect ────────────────┐
  ↓                    │
API Service             │
  ↓                    │
API                     │
  ↓                    │
Effect                  │
  ↓                    │
Success / Failure Action│
  ↓                    │
Reducer                 │
  ↓                    │
Store                   │
  ↓                    │
Selector                │
  ↓                    │
Component
```

The flow must never become:

```text
Component
  ↓
Component
  ↓
Service
  ↓
Store
  ↓
Component
  ↓
Service
  ↓
Store
```

Avoid circular state flows.

---

# 3. State Ownership

Before creating a store, classify the state.

## Local UI State

Keep local when it belongs only to one component.

Examples:

* Modal open/close
* Selected tab
* Temporary input
* Hover state
* Expanded section
* Local loading indicator

Use:

* Angular signals
* Component state
* Reactive forms

Do NOT automatically put these into NgRx.

---

## Feature State

Use NgRx when state is shared across multiple components or requires predictable orchestration.

Examples:

* Course data
* User profile
* Organisation data
* Permissions
* Application configuration
* Shared dashboard data
* Complex async workflows

---

## Global Application State

Examples:

* Authenticated user
* Current organisation
* User permissions
* Global configuration
* Application-level settings

These may be appropriate for centralized state.

---

## Server State

Data retrieved from APIs should be treated differently from local UI state.

Consider:

* NgRx Store
* NgRx Entity
* NgRx Signal Store
* NgRx Data
* Query/caching solution

Choose the simplest architecture that satisfies the requirements.

---

# 4. State Decision Matrix

Before creating a store, classify the state.

| Question                       | Yes              | No                      |
| ------------------------------ | ---------------- | ----------------------- |
| Shared by multiple components? | Consider Store   | Keep local              |
| Required across routes?        | Consider Store   | Keep feature-local      |
| Complex async workflow?        | Consider Effects | Service/local           |
| Requires caching?              | Consider Store   | API call                |
| Requires normalization?        | Consider Entity  | Normal state            |
| Needs derived data?            | Selectors        | Direct state            |
| Temporary UI state?            | Local            | Store only if justified |

Do not create a global store for simple CRUD screens without a clear requirement.

---

# 5. Feature-Based Architecture

Organize NgRx by feature.

Preferred structure:

```text
src/
└── app/
    └── features/
        └── courses/
            ├── pages/
            ├── components/
            ├── services/
            ├── models/
            └── store/
                ├── course.actions.ts
                ├── course.reducer.ts
                ├── course.effects.ts
                ├── course.selectors.ts
                ├── course.facade.ts
                └── index.ts
```

Avoid a giant global folder:

```text
store/
├── actions/
├── reducers/
├── effects/
├── selectors/
```

where unrelated features are mixed together.

Feature ownership should remain obvious.

---

# 6. State Model

State must contain only the minimum required information.

Example:

```ts
export interface CourseState {
  entities: Course[];
  selectedCourseId: string | null;
  loading: boolean;
  error: string | null;
}
```

Avoid:

```ts
export interface CourseState {
  courses: Course[];
  filteredCourses: Course[];
  sortedCourses: Course[];
  courseCount: number;
  hasCourses: boolean;
}
```

when those values can be derived.

---

# 7. Single Source of Truth

Do not store duplicate state.

Bad:

```text
courses
filteredCourses
activeCourses
courseCount
```

when they can be derived from:

```text
courses
filter
```

Prefer:

```text
State
 ↓
Selector
 ↓
Derived result
```

Selectors should calculate derived information.

---

# 8. Actions

Actions describe **events**, not implementation details.

Prefer:

```ts
loadCourses
loadCoursesSuccess
loadCoursesFailure
```

Avoid vague actions:

```ts
setData
updateStore
doSomething
```

Actions should answer:

> What happened?

---

# 9. Action Naming

Use descriptive event-oriented names.

Examples:

```ts
loadCourses
loadCoursesSuccess
loadCoursesFailure

createCourse
createCourseSuccess
createCourseFailure

updateCourse
updateCourseSuccess
updateCourseFailure

deleteCourse
deleteCourseSuccess
deleteCourseFailure
```

Avoid:

```ts
getCourses
callApi
setCourses
changeState
```

when the action is actually describing an event.

---

# 10. Action Grouping

Use feature action groups.

Example:

```ts
export const CourseActions = createActionGroup({
  source: 'Courses',
  events: {
    'Load Courses': emptyProps(),
    'Load Courses Success': props<{ courses: Course[] }>(),
    'Load Courses Failure': props<{ error: string }>(),
  },
});
```

Avoid unrelated actions inside one group.

---

# 11. Reducers

Reducers must be:

* Pure
* Predictable
* Immutable
* Side-effect free

Reducers must NOT:

* Call APIs
* Access localStorage
* Access sessionStorage
* Generate random values
* Access Date directly for business decisions
* Modify external services
* Perform navigation

Example:

```ts
export const courseReducer = createReducer(
  initialState,

  on(CourseActions.loadCourses, state => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(CourseActions.loadCoursesSuccess, (state, { courses }) => ({
    ...state,
    courses,
    loading: false,
  })),

  on(CourseActions.loadCoursesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
```

---

# 12. Effects

Effects handle side effects.

Use Effects for:

* HTTP requests
* Navigation
* Analytics
* Notifications
* External APIs
* Storage interaction when required
* Complex asynchronous workflows

Example:

```ts
loadCourses$ = createEffect(() =>
  this.actions$.pipe(
    ofType(CourseActions.loadCourses),
    switchMap(() =>
      this.courseService.getCourses().pipe(
        map(courses =>
          CourseActions.loadCoursesSuccess({ courses })
        ),
        catchError(error =>
          of(
            CourseActions.loadCoursesFailure({
              error: this.getErrorMessage(error),
            })
          )
        ),
      ),
    ),
  ),
);
```

---

# 13. RxJS Operator Validation

The analyst must validate whether the correct operator is used.

### switchMap

Use when a previous request should become irrelevant.

Example:

```text
Search
Autocomplete
Filter changes
```

### exhaustMap

Use when repeated triggers should be ignored while a request is active.

Example:

```text
Submit
Login
Save
```

### concatMap

Use when requests must execute sequentially.

### mergeMap

Use when concurrent requests are intentionally allowed.

Do not use operators arbitrarily.

---

# 14. Effects Must Not Become Business Logic Containers

Effects should coordinate operations.

Avoid placing large business rules directly inside Effects.

Bad:

```text
Effect
 ├── validation
 ├── transformation
 ├── business rules
 ├── API
 ├── permission logic
 └── navigation
```

Prefer:

```text
Effect
 ↓
Domain/Application Service
 ↓
API
```

where business logic is complex.

---

# 15. Selectors

Selectors are the primary read interface to the store.

Create selectors for:

* Entire feature state when necessary
* Entities
* Selected entity
* Loading
* Error
* Derived data
* Filtered data
* Permission checks

Example:

```ts
export const selectCourses =
  createSelector(
    selectCourseState,
    state => state.courses
  );
```

Derived:

```ts
export const selectActiveCourses =
  createSelector(
    selectCourses,
    courses => courses.filter(course => course.active)
  );
```

---

# 16. Selector Rules

Selectors must be:

* Pure
* Deterministic
* Reusable
* Small
* Composable

Avoid API calls inside selectors.

Avoid mutations.

Avoid expensive computations when they can be normalized or memoized appropriately.

---

# 17. Component Rules

Components should remain presentation-focused.

Preferred:

```text
Component
 ↓
Facade / Store
 ↓
Selectors
```

and:

```text
Component
 ↓
Facade / Store
 ↓
Actions
```

Avoid putting business logic into components.

---

# 18. Smart vs Presentational Components

### Smart Component

Responsible for:

* State interaction
* Actions
* Routing
* Feature orchestration

### Presentational Component

Responsible for:

* Display
* Inputs
* Outputs
* User interaction events

Example:

```text
CoursePage
    ↓
CourseList
    ↓
CourseCard
```

Avoid allowing deeply nested presentational components to directly access global state unless there is a strong reason.

---

# 19. Facade Pattern

For large enterprise applications, consider a feature facade.

Example:

```ts
@Injectable()
export class CourseFacade {

  readonly courses$ = this.store.select(
    CourseSelectors.selectCourses
  );

  readonly loading$ = this.store.select(
    CourseSelectors.selectLoading
  );

  loadCourses(): void {
    this.store.dispatch(
      CourseActions.loadCourses()
    );
  }
}
```

Component:

```ts
this.courseFacade.loadCourses();
```

Template:

```html
@if (courseFacade.loading$ | async) {
  ...
}
```

A facade can reduce direct Store coupling in complex features.

Do not introduce facades for tiny features without a reason.

---

# 20. NgRx Entity

Use `@ngrx/entity` when entity collections benefit from normalized state.

Good candidates:

* Courses
* Lessons
* Users
* Products
* Organisations

Typical structure:

```text
ids
entities
```

Benefits:

* Efficient lookup
* Update
* Delete
* Selection
* Normalized state

Do not use Entity purely because it exists.

---

# 21. API Service Responsibility

API services should handle HTTP communication.

Example:

```ts
CourseService
    ↓
HttpClient
    ↓
Backend API
```

Services should not secretly update NgRx Store.

Avoid:

```ts
courseService.getCourses()
  → HTTP
  → dispatch action
  → update store
```

unless the architecture explicitly defines that service as a state-management abstraction.

Prefer clear ownership.

---

# 22. Routing

Do not place route navigation randomly inside components.

Navigation resulting from an action may be handled by an Effect when appropriate.

Example:

```text
Create Course Success
        ↓
Effect
        ↓
Router
        ↓
Course Detail
```

Do not use Effects for every simple navigation.

---

# 23. Authentication and Authorization

Auth state should have clear ownership.

Typical:

```text
IAM/Auth Service
        ↓
Auth State
        ↓
Selectors
        ↓
Guards / Components
```

Never trust client-side NgRx state for authorization.

The backend must always enforce:

* Authentication
* Authorization
* Organisation access
* Permissions

NgRx is a client-side state mechanism, not a security boundary.

---

# 24. Persistence

Do not persist the entire NgRx store automatically.

Persist only what is necessary.

Examples:

Appropriate:

```text
Theme
Language
UI preferences
Non-sensitive settings
```

Be careful with:

```text
Authentication tokens
Personal data
Permissions
Sensitive application data
```

Never treat localStorage/sessionStorage as secure storage.

---

# 25. Loading State

Avoid one global:

```ts
loading: boolean
```

for unrelated operations.

Prefer feature/action-specific loading where necessary.

Example:

```ts
loadingCourses
creatingCourse
updatingCourse
deletingCourse
```

or model request state appropriately.

---

# 26. Error State

Errors should be structured when necessary.

Avoid storing only arbitrary strings when the UI needs more information.

Example:

```ts
interface ApiError {
  code: string;
  message: string;
  status: number;
}
```

Do not expose sensitive backend errors directly to users.

---

# 27. Success State

Avoid unnecessary:

```ts
success: boolean
```

that remains true indefinitely.

Model meaningful state transitions instead.

For example:

```text
idle
loading
success
error
```

when the feature genuinely requires it.

---

# 28. Avoid Store Pollution

Do NOT put these into NgRx by default:

* Every form field
* Every modal
* Every dropdown
* Hover state
* Temporary UI state
* Component-only state
* One-time API responses
* Static constants

NgRx should solve a problem, not become a dumping ground.

---

# 29. Store Size

The analyst must continuously check:

> Is the global store becoming too large?

If yes:

* Split by feature
* Lazy-load feature state
* Remove unnecessary state
* Move local state back to components
* Normalize entities
* Derive data through selectors

---

# 30. Lazy Loading

Feature state should be registered appropriately with lazy-loaded features.

Avoid loading every feature's store globally if the feature itself is lazy-loaded.

Preferred conceptual architecture:

```text
Application
│
├── Core State
│
├── Auth State
│
├── Shared State
│
└── Lazy Feature
      └── Feature State
```

---

# 31. Signals and Modern Angular

For modern Angular applications, evaluate whether a signal-based approach is more appropriate for local state.

Use Angular Signals for:

* Local reactive state
* Simple component state
* UI state

Use NgRx for:

* Complex shared state
* Cross-feature state
* Complex workflows
* Centralized state requirements

Do not use NgRx simply because the application uses Angular.

---

# 32. NgRx Signal Store

When the project already uses modern Angular APIs, evaluate whether `@ngrx/signals` / Signal Store is appropriate.

Consider Signal Store when:

* Feature state is localized
* State is complex
* Signals are already the application's primary reactive model
* The team wants less RxJS boilerplate

Do not mix multiple state-management patterns arbitrarily.

The project should have a documented rule for when to use:

```text
Angular Signals
NgRx Store
NgRx Signal Store
Services
```

---

# 33. State Management Decision

For every new feature, answer:

```text
Does this state need to be shared?

        ↓ No
Angular Signal / Component State

        ↓ Yes

Does it require complex centralized workflows?

        ↓ No
Feature Service / Signal Store

        ↓ Yes
NgRx Store
```

This is guidance, not an absolute rule.

---

# 34. Testing Requirements

Every important state-management unit should be testable.

Test:

### Actions

* Correct payload
* Correct event semantics

### Reducers

* Initial state
* Success
* Failure
* Updates
* Deletes

### Selectors

* Correct selection
* Derived data
* Empty states

### Effects

* Success
* Failure
* Correct RxJS operator
* Side effects
* Cancellation/concurrency

---

# 35. Type Safety

Avoid:

```ts
any
```

inside state management.

Prefer strongly typed:

```ts
interface CourseState {
  courses: Course[];
  loading: boolean;
  error: ApiError | null;
}
```

Actions must have strongly typed payloads.

Selectors must return known types.

---

# 36. Immutability

Never mutate state directly.

Incorrect:

```ts
state.courses.push(course);
return state;
```

Correct:

```ts
return {
  ...state,
  courses: [...state.courses, course],
};
```

Use NgRx's recommended immutable patterns.

---

# 37. Performance

Evaluate:

* Selector memoization
* Unnecessary subscriptions
* Excessive store updates
* Large entity collections
* Repeated API requests
* Unnecessary component re-renders
* Duplicate selectors
* Duplicate state

Avoid subscribing manually when the template can consume reactive state.

Prefer Angular's modern template/reactivity patterns where appropriate.

---

# 38. Subscription Management

Avoid manual subscriptions when unnecessary.

Prefer:

```html
@if (courses$ | async; as courses) {
  ...
}
```

or modern Angular signal/template patterns where appropriate.

If manual subscriptions are required:

* Ensure proper cleanup
* Avoid memory leaks
* Use appropriate Angular lifecycle mechanisms

---

# 39. Anti-Patterns

Flag these immediately:

### Anti-pattern 1

Component directly modifies state.

### Anti-pattern 2

Service dispatches unrelated actions.

### Anti-pattern 3

Reducer performs HTTP request.

### Anti-pattern 4

Selector performs side effects.

### Anti-pattern 5

Effect contains huge business logic.

### Anti-pattern 6

Every UI interaction becomes an action.

### Anti-pattern 7

Duplicate state.

### Anti-pattern 8

Global store contains component-only state.

### Anti-pattern 9

Hardcoded state values across components.

### Anti-pattern 10

Any type used in state.

### Anti-pattern 11

Effects trigger effects unnecessarily.

### Anti-pattern 12

Multiple sources of truth.

### Anti-pattern 13

Subscriptions nested inside subscriptions.

### Anti-pattern 14

Unnecessary manual subscriptions.

### Anti-pattern 15

Business authorization depends on NgRx state.

---

# 40. Corporate Coding Standards

Follow these principles:

```text
Feature ownership
Single responsibility
Strong typing
Predictable data flow
Immutable state
Reusable selectors
Minimal state
Testability
Clear naming
Low coupling
High cohesion
Separation of concerns
```

Code should be understandable by another senior developer without requiring tribal knowledge.

---

# 41. File Naming

Use consistent naming.

Example:

```text
course.actions.ts
course.reducer.ts
course.effects.ts
course.selectors.ts
course.facade.ts
course.models.ts
index.ts
```

Do not mix:

```text
course.store.ts
courses-state.ts
CourseState.ts
courseNgRx.ts
```

without a project-wide convention.

---

# 42. Folder Naming

Prefer feature ownership.

```text
features/
└── courses/
    └── store/
        ├── course.actions.ts
        ├── course.reducer.ts
        ├── course.effects.ts
        ├── course.selectors.ts
        ├── course.facade.ts
        └── index.ts
```

Avoid centralizing every feature's files into unrelated global directories.

---

# 43. Code Review Checklist

Before approving an NgRx implementation, check:

### Architecture

* [ ] Correct feature ownership
* [ ] State is genuinely shared
* [ ] No unnecessary global state
* [ ] Clear data flow
* [ ] No circular dependencies

### Actions

* [ ] Event-oriented names
* [ ] Strongly typed payloads
* [ ] No vague action names

### Reducers

* [ ] Pure
* [ ] Immutable
* [ ] No side effects
* [ ] Minimal state

### Effects

* [ ] API calls handled correctly
* [ ] Correct RxJS operator
* [ ] Error handling
* [ ] No excessive business logic

### Selectors

* [ ] Pure
* [ ] Memoized
* [ ] Derived data handled through selectors
* [ ] No duplicate state

### Components

* [ ] No unnecessary business logic
* [ ] No unnecessary subscriptions
* [ ] Clear state consumption

### Services

* [ ] API responsibility only
* [ ] No hidden state mutations
* [ ] Clear boundaries

### Testing

* [ ] Reducers tested
* [ ] Selectors tested
* [ ] Effects tested
* [ ] Important facade logic tested

### Security

* [ ] No secrets in store
* [ ] No security decisions based only on client state
* [ ] Sensitive data minimized
* [ ] Backend authorization enforced

---

# 44. Validation Scoring

Score each feature:

| Category        | Score |
| --------------- | ----: |
| Architecture    |   /10 |
| State Design    |   /10 |
| Actions         |   /10 |
| Reducers        |   /10 |
| Effects         |   /10 |
| Selectors       |   /10 |
| Components      |   /10 |
| Services        |   /10 |
| Performance     |   /10 |
| Testing         |   /10 |
| Security        |   /10 |
| Maintainability |   /10 |

Overall:

```text
9–10     Excellent
8–8.9    Enterprise ready
7–7.9    Good but requires improvements
6–6.9    Needs refactoring
<6       Significant architectural issues
```

---

# 45. Issue Priority

### P0 — Critical

* Broken state flow
* Security issue
* Data corruption
* Severe race condition
* State inconsistency

### P1 — High

* Major architecture violation
* Duplicate source of truth
* Incorrect Effect behaviour
* Significant performance issue
* Poor feature boundaries

### P2 — Medium

* Naming inconsistencies
* Unnecessary state
* Missing selectors
* Moderate testing gaps

### P3 — Low

* Minor refactoring
* Style improvements
* Small naming improvements

---

# 46. Required Analysis Output

For every feature, produce:

```text
# NgRx Architecture Review

Feature:
[Feature name]

Overall Score:
X/10

## Current Flow

Component
↓
Action
↓
Effect
↓
Service
↓
API
↓
Effect
↓
Reducer
↓
Selector
↓
Component

## Architecture Assessment

[Analysis]

## State Assessment

[Analysis]

## Actions

### Pros
- ...

### Cons
- ...

### Recommendations
- ...

## Reducers

### Pros
- ...

### Cons
- ...

### Recommendations
- ...

## Effects

### Pros
- ...

### Cons
- ...

### Recommendations
- ...

## Selectors

### Pros
- ...

### Cons
- ...

### Recommendations
- ...

## Components

[Analysis]

## API Services

[Analysis]

## Testing

[Analysis]

## Performance

[Analysis]

## Security

[Analysis]

## Issues

P0:
- ...

P1:
- ...

P2:
- ...

P3:
- ...

## Recommended Changes

1.
2.
3.

## Final Verdict

KEEP / IMPROVE / REFACTOR / REDESIGN
```

---

# 47. Modification Rules

When asked to fix an implementation:

1. Inspect existing architecture.
2. Understand the current data flow.
3. Identify the smallest safe architectural improvement.
4. Preserve existing functionality.
5. Do not rewrite unrelated features.
6. Do not introduce unnecessary abstractions.
7. Follow existing project conventions when they are sound.
8. Use modern Angular/NgRx APIs appropriate to the project's version.
9. Update tests when behaviour changes.
10. Validate the complete flow after modification.

---

# 48. Golden Architecture

The preferred enterprise pattern is:

```text
┌───────────────────────────────┐
│          UI Layer             │
│                               │
│ Pages / Components            │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│     Presentation Boundary     │
│                               │
│ Facade / Store API             │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
     Actions          Selectors
        │                │
        ▼                │
     Effects             │
        │                │
        ▼                │
   Application/API       │
     Services            │
        │                │
        ▼                │
     Backend             │
        │                │
        └───────┬────────┘
                ▼
             Reducer
                │
                ▼
              Store
                │
                ▼
            Selectors
                │
                ▼
               UI
```

This architecture should be adapted to the feature rather than applied mechanically.

---

# 49. Final Golden Rules

Always follow these rules:

1. **Do not put everything into NgRx.**
2. **Keep state minimal.**
3. **Have one source of truth.**
4. **Actions describe events.**
5. **Reducers remain pure.**
6. **Effects handle side effects.**
7. **Selectors provide derived state.**
8. **Services handle API communication.**
9. **Components should remain simple.**
10. **Use facades when they provide meaningful architectural value.**
11. **Use Entity when normalized collections provide value.**
12. **Use Signals for appropriate local state.**
13. **Do not store secrets.**
14. **Never rely on client state for authorization.**
15. **Use strong TypeScript types.**
16. **Test important state transitions.**
17. **Keep features independently understandable.**
18. **Avoid unnecessary abstractions.**
19. **Prefer predictable data flow over clever code.**
20. **The simplest architecture that satisfies the requirements is preferred.**

---

# 50. Definition of Done

An NgRx feature is considered production-ready only when:

* State ownership is clearly defined.
* State is minimal.
* There is one source of truth.
* Actions represent meaningful events.
* Reducers are pure and immutable.
* Effects correctly handle side effects.
* RxJS operators match the business behaviour.
* Selectors are reusable and memoized.
* Components are not overloaded with state logic.
* API services have clear boundaries.
* Errors are handled.
* Loading states are handled.
* Tests cover important state transitions.
* No sensitive secrets are stored.
* Client state is not treated as a security boundary.
* The feature follows the project's naming and folder conventions.
* The architecture can be understood and maintained by another developer.
* The implementation does not introduce unnecessary NgRx complexity.

**Final principle:**

> Use NgRx to make complex shared state predictable—not to make simple state complicated.

# Existing Project Structure Preservation

## Mandatory Rule

**DO NOT CHANGE THE EXISTING PROJECT FOLDER STRUCTURE unless the user explicitly requests a folder-structure change.**

The existing project architecture is the source of truth for file and folder placement.

When implementing or reviewing NgRx:

* Do not move existing files merely to match an ideal NgRx structure.
* Do not rename existing folders unnecessarily.
* Do not create a new global `store/` structure if the project does not already use one.
* Do not reorganize `features`, `modules`, `components`, `services`, or other directories.
* Do not migrate files between folders solely for architectural preference.
* Do not introduce a new folder hierarchy just because it is recommended by an example.
* Do not perform large-scale restructuring as part of an NgRx implementation.
* Preserve existing import paths whenever reasonably possible.
* Preserve existing lazy-loading boundaries.
* Preserve existing module/feature boundaries.
* Preserve existing naming conventions when they are already consistent.

---

## NgRx Must Adapt to the Existing Architecture

NgRx implementation must fit into the current project structure.

Before creating files:

1. Inspect the existing folder structure.
2. Identify the feature's existing location.
3. Identify existing state-management conventions.
4. Identify existing services.
5. Identify existing models/interfaces.
6. Identify existing shared/core structures.
7. Determine the smallest appropriate location for NgRx files.
8. Follow the existing project's naming conventions.

Only then implement NgRx.

---

## Example

If the existing project is:

```text
src/
└── app/
    ├── modules/
    │   ├── courses/
    │   │   ├── components/
    │   │   ├── pages/
    │   │   ├── services/
    │   │   └── models/
    │   │
    │   └── users/
    │       ├── components/
    │       ├── pages/
    │       └── services/
    │
    ├── shared/
    └── core/
```

Do **not** automatically convert it to:

```text
src/
└── app/
    └── features/
        └── courses/
            └── store/
```

Instead, determine where the NgRx files naturally belong within the existing architecture.

For example:

```text
src/
└── app/
    ├── modules/
    │   ├── courses/
    │   │   ├── components/
    │   │   ├── pages/
    │   │   ├── services/
    │   │   ├── models/
    │   │   └── store/
    │   │       ├── course.actions.ts
    │   │       ├── course.reducer.ts
    │   │       ├── course.effects.ts
    │   │       └── course.selectors.ts
    │   │
    │   └── users/
    │
    ├── shared/
    └── core/
```

This is only an example.

**The actual location must be determined from the existing project structure.**

---

# Do Not Introduce Architecture Drift

Do not introduce a second architectural pattern alongside the existing one without justification.

For example, if the application currently uses:

```text
modules/
```

do not introduce:

```text
features/
```

just for new NgRx code.

If the application currently uses:

```text
*.service.ts
```

do not introduce:

```text
*.facade.ts
```

everywhere unless a facade provides a clear architectural benefit.

If the application already has a state-management convention, follow it.

---

# Minimal Change Principle

When modifying an existing application:

```text
Existing Architecture
        ↓
Understand
        ↓
Validate
        ↓
Make Minimal Change
        ↓
Preserve Existing Structure
        ↓
Validate Again
```

Avoid:

```text
Existing Architecture
        ↓
Rewrite
        ↓
Move Files
        ↓
Rename Everything
        ↓
Introduce New Structure
```

---

# Explicit Permission Requirement

A folder restructuring is allowed **only when the user explicitly asks for it**.

Examples of explicit requests:

* "Reorganize the project."
* "Move the NgRx store into a feature-based architecture."
* "Convert the project to Nx."
* "Change the folder structure."
* "Refactor the entire architecture."

If the user has not explicitly requested restructuring:

> **Do not restructure.**

If the existing folder structure has architectural problems, report them as recommendations instead of automatically changing them.

Example:

```text
Architecture Issue:
The current folder structure makes feature ownership difficult.

Recommendation:
Consider migrating to a feature-based structure in a future refactoring phase.

Action:
No folder restructuring performed because it was not requested.
```

---

# File Creation Rule

New files may be created when required for the implementation, but they must be placed within the existing architectural boundaries.

Before creating a new folder, ask:

1. Does an appropriate existing folder already exist?
2. Does the feature already have a convention for this type of file?
3. Can the new file follow the existing structure?
4. Is the new folder genuinely necessary?

Prefer:

```text
Use existing structure
        ↓
Add required files
        ↓
Minimal change
```

over:

```text
Create new architecture
        ↓
Move existing files
        ↓
Rewrite imports
```

---

# Import Stability

Avoid unnecessary import-path changes.

Do not move files simply to make imports "cleaner".

If an alias/path convention already exists, follow it.

After any required change, validate:

* Relative imports
* Path aliases
* Lazy-loaded routes
* Barrel exports
* Dependency injection
* Circular dependencies

---

# Existing Naming Convention Rule

The existing project naming convention takes precedence over generic NgRx naming recommendations.

For example, if the project uses:

```text
course.store.ts
```

do not rename it to:

```text
course.reducer.ts
course.actions.ts
course.effects.ts
course.selectors.ts
```

unless the project is actually being migrated to that convention.

Consistency within the existing project is more important than theoretical naming purity.

---

# Review vs Refactor

The skill must clearly distinguish between:

### Validation

Identify problems without changing the architecture.

### Correction

Fix the implementation while preserving the architecture.

### Refactoring

Improve architecture without changing functionality.

### Restructuring

Move/reorganize folders and files.

**Restructuring requires explicit user approval.**

---

# Final Architecture Rule

The goal is NOT:

> "Make the project look like an ideal NgRx project."

The goal is:

> **"Implement enterprise-grade NgRx within the application's existing architecture with the smallest safe change."**

Existing project structure > generic folder recommendations.

Existing conventions > theoretical conventions.

Minimal change > unnecessary refactoring.

User-requested architecture > default architecture.
