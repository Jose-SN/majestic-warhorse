# Majestic Warhorse Backend — API Documentation

Base URL: `http://localhost:{PORT}` (default `8080` / `8081` from `.env`)

Interactive Swagger UI: `GET /api-docs`

All request bodies are JSON unless noted (`multipart/form-data` for file uploads).

---

## General

### Standard response shapes

**Success (most endpoints):**
```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Notes:**
- Many endpoints accept both `snake_case` and `camelCase` field names where noted.
- Auth middleware is commented out in routes; user IDs are passed in body or query params.

---

## Health Check

| Method | Path | Description |
|--------|------|-------------|
| `ALL` | `/health-check` | Server health check |

**Response `200`:**
```json
{
  "timeZone": "2026-07-06T10:00:00.000Z",
  "code": 200,
  "message": "success"
}
```

---

## Root

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | App name (HTML) |
| `GET` | `/api-docs` | Swagger UI |

---

## Courses — `/course`

### Get all courses
`GET /course/get`

**Query params (optional):**
| Param | Type | Description |
|-------|------|-------------|
| `populateChapters` | boolean | Include chapter data |
| `populateFiles` | boolean | Include file data |

**Response `200`:** Array of course objects.

---

### Get course by ID
`GET /course/get/:id`

**Response `200`:** Single course object.

---

### Create course (with chapters & files)
`POST /course/save`

**Body:**
```json
{
  "courseCoverImage": "https://...",
  "courseTitle": "Course title",
  "courseDescription": "Description",
  "createdBy": "user-uuid",
  "chapterDetails": [
    {
      "chapterTitle": "Chapter 1",
      "attachments": [],
      "createdBy": "user-uuid",
      "files": [],
      "fileDetails": [
        {
          "description": "File description",
          "fileURL": "https://...",
          "fileName": "document.pdf"
        }
      ]
    }
  ]
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully added",
  "data": { }
}
```

---

### Update course
`PUT /course/update`

**Body:**
```json
{
  "id": "course-uuid",
  "courseCoverImage": "https://...",
  "courseTitle": "Updated title",
  "courseDescription": "Updated description",
  "createdBy": "user-uuid",
  "chapterDetails": [
    {
      "id": "chapter-uuid",
      "chapterTitle": "Chapter title",
      "attachments": [],
      "createdBy": "user-uuid",
      "files": [],
      "fileDetails": [
        {
          "id": "file-uuid",
          "description": "...",
          "fileURL": "https://...",
          "fileName": "file.pdf",
          "createdBy": "user-uuid"
        }
      ]
    }
  ]
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Course, chapters, and files updated successfully"
}
```

---

### Delete course
`DELETE /course/delete/:courseid`

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully deleted"
}
```

---

## Chapters — `/chapter`

### Get chapters
`GET /chapter/get`

**Response `200`:** Array of chapter objects (no `:id` route defined; returns all).

---

### Create chapter
`POST /chapter/save`

**Body:**
```json
{
  "chapterTitle": "Chapter title",
  "courseId": "course-uuid",
  "createdBy": "user-uuid",
  "attachments": [],
  "files": []
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully added",
  "data": { }
}
```

---

### Update chapter
`PUT /chapter/update`

**Body:** (must include `id`)
```json
{
  "id": "chapter-uuid",
  "chapterTitle": "Updated title",
  "courseId": "course-uuid",
  "createdBy": "user-uuid",
  "attachments": [],
  "files": ["file-uuid"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully updated"
}
```

---

### Delete chapter
`DELETE /chapter/delete/:chapterid`

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully deleted"
}
```

---

## Files — `/file`

Files are stored in Supabase Storage (S3-compatible). Upload returns a public URL.

### List files (storage bucket)
`GET /file/get`

**Response `200`:** Array of `{ key, lastModified, size, url }`.

---

### Get / stream file by ID
`GET /file/get/:fileId`

Streams file content. Videos are streamed inline; other files are downloaded.

---

### Fetch file blob by URL
`POST /file/get-blob`

**Body:**
```json
{
  "fileUrl": "https://..."
}
```

**Response:** Binary stream with appropriate `Content-Type`.

---

### Save file metadata (database record)
`POST /file/save`

**Body:**
```json
{
  "parentId": "chapter-uuid",
  "parentType": "Chapter",
  "description": "File description",
  "fileURL": "https://...",
  "fileName": "document.pdf",
  "createdBy": "user-uuid"
}
```

`parentType`: `"Course"` | `"Chapter"` | `"User"`

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully added",
  "data": { }
}
```

---

### Upload file to storage
`POST /file/upload`

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | File to upload (max size: `FILEUPLOADLIMIT` GB from `.env`) |

**Response `200`:**
```json
{
  "message": "File uploaded successfully",
  "url": "https://{project}.supabase.co/storage/v1/object/public/{bucket}/majestic-warhorse-uploads/{timestamp}_{filename}"
}
```

---

### Update file in storage
`PUT /file/update/:fileId`

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | Replacement file |

**Response `200`:**
```json
{
  "message": "File updated successfully"
}
```

---

### Delete file from storage
`DELETE /file/delete/:fileId`

**Response `200`:**
```json
{
  "message": "File deleted successfully"
}
```

---

## Status — `/status`

### Get statuses
`GET /status/get`

**Response `200`:** Array of status objects.

---

### Get status overview
`GET /status/get-overview`

**Response `200`:** Status overview aggregate data.

---

### Create status
`POST /status/save`

**Body:**
```json
{
  "parentId": "course-or-chapter-uuid",
  "parentType": "Course",
  "percentage": "75",
  "comment": "Progress comment",
  "rating": 4,
  "reward": 10,
  "createdBy": "user-uuid"
}
```

`parentType`: `"Course"` | `"Chapter"` | `"File"`

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully added",
  "data": { }
}
```

---

### Update status
`PUT /status/update`

**Body:** Full status object including `id`.

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully updated"
}
```

---

### Delete status
`DELETE /status/delete/:statusid`

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully deleted"
}
```

---

## Dashboard — `/dashboard`

### Get dashboard overview
`GET /dashboard/get`

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `isAdmin` | boolean | Admin dashboard stats |
| `isTeacher` | boolean | Teacher dashboard stats |
| `id` | string | User ID (required for teacher/student) |

**Admin response:**
```json
{
  "totalCourses": 10
}
```

**Teacher response:**
```json
{
  "uploadedCourses": 5,
  "assignedStudents": 20,
  "taskSubmitted": 15,
  "courseCompleted": 8
}
```

**Student response:**
```json
{
  "totalCourses": 10,
  "completedCourses": 3,
  "coursesVisited": 7,
  "taskSubmitted": 5
}
```

---

## Questions — `/question`

### Get questions
`GET /question/get`

**Response `200`:** Array of question objects.

---

### Create question
`POST /question/save`

**Body:**
```json
{
  "course_id": "course-uuid",
  "question": "What is HTML?",
  "type": "Textbox",
  "options": [
    { "label": "Option A", "value": "a" }
  ],
  "created_by": "user-uuid"
}
```

`type` examples: `"Textbox"`, `"SingleChoice"`, `"Checkbox"`

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully added",
  "data": { }
}
```

---

### Update question
`PUT /question/update/:questionId`

**Body:** Question fields to update.

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully updated"
}
```

---

### Delete question
`DELETE /question/delete/:questionid`

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully deleted"
}
```

---

## Answers — `/answer`

PostgreSQL-backed. Supports single-choice (string) and checkbox (JSON string) answers.

### Get answers
`GET /answer/get`  
`GET /answer/get/:id`

**Query params (optional filters):**
| Param | Aliases | Description |
|-------|---------|-------------|
| `submitted_by` | `submittedBy` | Filter by user |
| `course_id` | `courseId` | Filter by course |
| `question_id` | `questionId` | Filter by question |

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": []
}
```

---

### Save answer(s)
`POST /answer/save`

**Single answer body:**
```json
{
  "course_id": "course-uuid",
  "question_id": "question-uuid",
  "answer": "\"Option A\"",
  "submitted_by": "user-uuid"
}
```

**Bulk save body** (array of answer objects):
```json
[
  {
    "course_id": "course-uuid",
    "question_id": "question-uuid",
    "answer": "\"Answer 1\"",
    "submitted_by": "user-uuid"
  },
  {
    "course_id": "course-uuid",
    "question_id": "question-uuid-2",
    "answer": "[\"Option1\", \"Option2\"]",
    "submitted_by": "user-uuid"
  }
]
```

**Answer format:**
- Single choice: JSON-encoded string, e.g. `"\"Option A\""`
- Checkbox: JSON array string, e.g. `"[\"Option1\", \"Option2\"]"`

**Response `201` (single):**
```json
{
  "success": true,
  "message": "Successfully added",
  "data": { }
}
```

**Response `201` (bulk):**
```json
{
  "success": true,
  "message": "Saved 5 answer(s)",
  "data": {
    "saved": [],
    "failed": []
  }
}
```

---

### Update answer
`PUT /answer/update`

**Body:**
```json
{
  "id": "answer-uuid",
  "course_id": "course-uuid",
  "question_id": "question-uuid",
  "answer": "\"Updated answer\"",
  "submitted_by": "user-uuid"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully updated",
  "data": { }
}
```

---

### Delete answer
`DELETE /answer/delete/:answerid`

**Response `200`:**
```json
{
  "success": true,
  "message": "Successfully deleted"
}
```

---

## Favorites — `/favorites`

### Get user favorites
`GET /favorites/get`  
`GET /favorites/`

**Query params:**
| Param | Aliases | Required |
|-------|---------|----------|
| `user_id` | `userId` | Yes |

**Response `200`:**
```json
{
  "success": true,
  "data": []
}
```

Includes course details when available.

---

### Check if course is favorited
`GET /favorites/check`

**Query params:**
| Param | Required |
|-------|----------|
| `course_id` | Yes |
| `user_id` / `userId` | Yes |

**Response `200`:**
```json
{
  "success": true,
  "data": { }
}
```

---

### Add favorite
`POST /favorites/save`

**Body:**
```json
{
  "userId": "user-uuid",
  "courseId": "course-uuid"
}
```

Also accepts `user_id` / `course_id`.

**Response `201`:**
```json
{
  "success": true,
  "data": { }
}
```

**Response `409`:** Course already in favorites.

---

### Remove favorite by course
`DELETE /favorites/course/:course_id`

**Query params:** `user_id` required (unless auth token present).

**Response `200`:**
```json
{
  "success": true,
  "message": "Removed from favorites"
}
```

---

### Remove favorite by ID
`DELETE /favorites/:id`

**Response `200`:**
```json
{
  "success": true,
  "message": "Removed from favorites"
}
```

---

## Teacher–Students — `/teacher-students`

### Get all relationships
`GET /teacher-students/get`

### Get relationship by ID
`GET /teacher-students/get/:id`

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": []
}
```

---

### Get students for a teacher
`GET /teacher-students/teacher/:teacherId/students`

---

### Get teachers for a student
`GET /teacher-students/student/:studentId/teachers`

---

### Get assigned teachers for a user
`GET /teacher-students/assigned-teachers/:user_id`

---

### Create relationship
`POST /teacher-students/save`

**Body:**
```json
{
  "teacher_id": "teacher-uuid",
  "student_id": "student-uuid"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Teacher-student relationship created successfully",
  "data": { }
}
```

---

### Assign teachers to students (bulk)
`POST /teacher-students/assign-teachers`

**Body:**
```json
[
  {
    "student_id": "student-uuid",
    "teacher_ids": ["teacher-uuid-1", "teacher-uuid-2"]
  }
]
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Teachers assigned successfully",
  "data": {
    "successful": [],
    "failed": [],
    "summary": { "total": 2, "successful": 2, "failed": 0 }
  }
}
```

---

### Unassign teachers from a student
`POST /teacher-students/unassign-teachers`

**Body:**
```json
{
  "student_id": "student-uuid",
  "unassign_teacher_ids": ["teacher-uuid-1"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Teachers unassigned successfully",
  "data": { "deletedCount": 1 }
}
```

---

### Assign students to teachers (bulk)
`POST /teacher-students/assign-students`

**Body:**
```json
[
  {
    "teacher_id": "teacher-uuid",
    "student_ids": ["student-uuid-1", "student-uuid-2"]
  }
]
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Students assigned successfully",
  "data": {
    "successful": [],
    "failed": [],
    "summary": { "total": 2, "successful": 2, "failed": 0 }
  }
}
```

---

### Unassign students from a teacher
`POST /teacher-students/unassign-students`

**Body:**
```json
{
  "teacher_id": "teacher-uuid",
  "unassign_student_ids": ["student-uuid-1"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Students unassigned successfully",
  "data": { "deletedCount": 1 }
}
```

---

### Update relationship
`PUT /teacher-students/update/:id`

**Body:**
```json
{
  "teacher_id": "teacher-uuid",
  "student_id": "student-uuid"
}
```

---

### Delete relationship by ID
`DELETE /teacher-students/delete/:id`

---

### Delete all relationships for a teacher
`DELETE /teacher-students/teacher/:teacherId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Deleted 3 teacher-student relationship(s)",
  "data": { "deletedCount": 3 }
}
```

---

### Delete all relationships for a student
`DELETE /teacher-students/student/:studentId`

---

### Delete specific teacher–student pair
`DELETE /teacher-students/teacher/:teacherId/student/:studentId`

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad request / validation error |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate favorite) |
| `500` | Internal server error |

---

## Environment Variables (reference)

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port |
| `DATABASE_URL` | PostgreSQL (Supabase pooler) connection string |
| `DB_SSL` | Enable SSL for database (`true` for Supabase) |
| `SUPABASE_URL` | Supabase Storage S3 endpoint |
| `SUPABASE_ACCESS_ID` | Storage access key ID |
| `SUPABASE_ACCESS_KEY` | Storage secret access key |
| `SUPABASE_BUCKET_NAME` | Storage bucket name |
| `FILEUPLOADLIMIT` | Max upload size in GB |
