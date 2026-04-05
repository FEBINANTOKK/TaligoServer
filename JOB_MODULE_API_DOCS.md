# Job Module - API Documentation

## Overview

This is a production-ready Job Module for managing job postings in your Node.js/Express/MongoDB application with Better Auth authentication.

## Features

✅ Full CRUD operations for jobs
✅ Role-based access control (RECRUITER, ORG_ADMIN)
✅ Organization-scoped jobs
✅ Comprehensive input validation
✅ Proper error handling with status codes
✅ Indexed queries for performance
✅ TypeScript support with proper interfaces
✅ Populated references for better data retrieval

## API Endpoints

### Public Routes (No Authentication Required)

#### GET /api/jobs

Retrieve all jobs sorted by newest first.

**Response (200):**

```json
{
  "success": true,
  "message": "Jobs fetched successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Senior Frontend Developer",
      "description": "We are looking for a talented frontend developer...",
      "organizationId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Tech Corp"
      },
      "createdBy": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "recruiter"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### GET /api/jobs/:id

Retrieve a specific job by ID.

**URL Parameters:**

- `id` (string, required): Job ID

**Response (200):**

```json
{
  "success": true,
  "message": "Job fetched successfully",
  "data": {
    /* job object */
  }
}
```

**Errors:**

- `400`: Invalid job ID format
- `404`: Job not found

#### GET /api/jobs/organization/:organizationId

Retrieve all jobs for a specific organization.

**URL Parameters:**

- `organizationId` (string, required): Organization ID

**Response (200):**

```json
{
  "success": true,
  "message": "Organization jobs fetched successfully",
  "data": [
    /* array of jobs */
  ]
}
```

### Protected Routes (Requires Authentication)

#### POST /api/jobs

Create a new job. Only accessible to RECRUITER and ORG_ADMIN roles.

**Headers:**

- `Authorization`: Bearer token (from Better Auth)
- `Content-Type`: application/json

**Request Body:**

```json
{
  "title": "Senior Backend Developer",
  "description": "We are looking for an experienced backend developer with 5+ years of experience..."
}
```

**Validation Rules:**

- `title`: Required, 3-100 characters, string
- `description`: Required, minimum 10 characters, string

**Response (201):**

```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Senior Backend Developer",
    "description": "...",
    "organizationId": "507f1f77bcf86cd799439012",
    "createdBy": "507f1f77bcf86cd799439013",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors:**

- `400`: Validation error
- `401`: Not authenticated
- `403`: User doesn't have recruiter/admin role or not part of an organization
- `500`: Server error

#### PUT /api/jobs/:id

Update an existing job. Only the creator or organization admin can update.

**Headers:**

- `Authorization`: Bearer token
- `Content-Type`: application/json

**URL Parameters:**

- `id` (string, required): Job ID

**Request Body (partial update):**

```json
{
  "title": "Updated Job Title",
  "description": "Updated job description"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Job updated successfully",
  "data": {
    /* updated job object */
  }
}
```

**Errors:**

- `400`: Validation error or invalid ID format
- `401`: Not authenticated
- `403`: Not authorized (not creator or org admin)
- `404`: Job not found
- `500`: Server error

#### DELETE /api/jobs/:id

Delete a job. Only the creator or organization admin can delete.

**Headers:**

- `Authorization`: Bearer token

**URL Parameters:**

- `id` (string, required): Job ID

**Response (200):**

```json
{
  "success": true,
  "message": "Job deleted successfully",
  "data": null
}
```

**Errors:**

- `400`: Invalid ID format
- `401`: Not authenticated
- `403`: Not authorized (not creator or org admin)
- `404`: Job not found
- `500`: Server error

## Data Models

### Job Schema

```typescript
interface IJob extends Document {
  title: string; // Job title (3-100 chars)
  description: string; // Job description (min 10 chars)
  organizationId: ObjectId; // Reference to Organization
  createdBy: ObjectId; // Reference to User who created
  createdAt: Date; // Timestamp
}
```

## Role-Based Access Control

| Endpoint                       | CANDIDATE | RECRUITER | ORG_ADMIN    | SUPERADMIN |
| ------------------------------ | --------- | --------- | ------------ | ---------- |
| GET /api/jobs                  | ✅        | ✅        | ✅           | ✅         |
| GET /api/jobs/:id              | ✅        | ✅        | ✅           | ✅         |
| GET /api/jobs/organization/:id | ✅        | ✅        | ✅           | ✅         |
| POST /api/jobs                 | ❌        | ✅        | ✅           | ✅         |
| PUT /api/jobs/:id              | ❌        | ✅ (own)  | ✅ (own org) | ✅         |
| DELETE /api/jobs/:id           | ❌        | ✅ (own)  | ✅ (own org) | ✅         |

## Error Codes

| Status | Code                  | Meaning                              |
| ------ | --------------------- | ------------------------------------ |
| 200    | OK                    | Successful GET/PUT request           |
| 201    | CREATED               | Successful POST request              |
| 400    | Bad Request           | Validation error or invalid input    |
| 401    | Unauthorized          | Not authenticated or invalid session |
| 403    | Forbidden             | Authenticated but lacking permission |
| 404    | Not Found             | Resource not found                   |
| 500    | Internal Server Error | Server error                         |

## Implementation Notes

### Database Indexes

Jobs collection has these indexes for performance:

- `organizationId`
- `createdAt`
- `organizationId + createdAt` (compound index)

### Middleware Stack

Routes use this middleware stack:

1. `requireAuth` - Validates Better Auth session
2. `requireRole(["recruiter", "orgadmin"])` - Checks user role (for protected routes)

### Validation

- All string inputs are trimmed
- Minimum/maximum length constraints enforced
- ObjectId format validation
- Type checking for all inputs

### Security

- User can only see/modify jobs within their organization (for updates/deletes)
- OrgAdmin can manage all jobs in their organization
- CreatedBy is automatically set from req.user.\_id
- OrganizationId is automatically set from req.user.organizationId

## File Structure

```
src/
├── models/
│   └── Job.ts                 # Mongoose schema and interface
├── controllers/
│   └── job.controller.ts      # Business logic
├── routes/
│   └── job.routes.ts          # API route definitions
├── middleware/
│   └── role.middleware.ts     # Role-based access control
└── server.ts                  # Updated with jobRoutes
```

## Usage Examples

### Create a Job (cURL)

```bash
curl -X POST http://localhost:4000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<your-token>" \
  -d '{
    "title": "Full Stack Developer",
    "description": "Join our team as a Full Stack Developer with experience in React, Node.js, and MongoDB"
  }'
```

### Get All Jobs

```bash
curl http://localhost:4000/api/jobs
```

### Get Single Job

```bash
curl http://localhost:4000/api/jobs/507f1f77bcf86cd799439011
```

### Update Job (JavaScript/Fetch)

```javascript
const response = await fetch(
  "http://localhost:4000/api/jobs/507f1f77bcf86cd799439011",
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      title: "Updated Job Title",
      description: "Updated description with more details",
    }),
  },
);
const data = await response.json();
```

### Delete Job

```javascript
const response = await fetch(
  "http://localhost:4000/api/jobs/507f1f77bcf86cd799439011",
  {
    method: "DELETE",
    credentials: "include",
  },
);
const data = await response.json();
```

## Testing Checklist

- [ ] GET /api/jobs returns all jobs
- [ ] GET /api/jobs/:id returns specific job
- [ ] GET /api/jobs/:id returns 404 for non-existent job
- [ ] POST /api/jobs creates job (RECRUITER/ORG_ADMIN only)
- [ ] POST /api/jobs returns 401 for unauthenticated user
- [ ] POST /api/jobs returns 403 for CANDIDATE role
- [ ] POST /api/jobs validates title (min 3, max 100 chars)
- [ ] POST /api/jobs validates description (min 10 chars)
- [ ] PUT /api/jobs/:id updates job by creator
- [ ] PUT /api/jobs/:id updates job by org admin
- [ ] PUT /api/jobs/:id returns 403 for non-creator/admin
- [ ] DELETE /api/jobs/:id deletes job by creator
- [ ] DELETE /api/jobs/:id deletes job by org admin
- [ ] DELETE /api/jobs/:id returns 403 for non-creator/admin

## Environment Variables

Ensure your `.env` file has:

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/your_database
# Other env vars...
```

## Production Considerations

✅ Already Implemented:

- Input validation and sanitization
- Role-based access control
- Proper error handling
- Database indexes
- TypeScript type safety
- Comprehensive logging

🔧 Recommended Enhancements:

- Add request rate limiting
- Add caching layer (Redis)
- Add soft delete functionality
- Add audit logging
- Add pagination for GET /api/jobs
- Add search/filter functionality
- Add job status field (active, archived)
- Add job categories/tags
- Add salary information fields
- Add application count tracking
