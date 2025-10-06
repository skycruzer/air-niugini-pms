# API Documentation

## Air Niugini B767 Pilot Management System

**Version:** 1.0.0
**Base URL:** `https://your-domain.com/api`
**Authentication:** Bearer Token (JWT)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Pilots API](#pilots-api)
3. [Certifications API](#certifications-api)
4. [Leave Requests API](#leave-requests-api)
5. [Dashboard API](#dashboard-api)
6. [Reports API](#reports-api)
7. [Health Check API](#health-check-api)
8. [Webhooks API](#webhooks-api)
9. [Error Handling](#error-handling)

---

## Authentication

All API requests require authentication using JWT tokens from Supabase Auth.

### Authentication Header

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Getting a Token

```javascript
// Using Supabase client
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

const token = data.session.access_token;
```

### Token Refresh

Tokens expire after 1 hour. Use the refresh token to get a new access token:

```javascript
const { data, error } = await supabase.auth.refreshSession();
const newToken = data.session.access_token;
```

---

## Pilots API

### List All Pilots

```http
GET /api/pilots
```

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50)
- `search` (string, optional): Search by name or employee ID
- `is_active` (boolean, optional): Filter by active status
- `role` (string, optional): Filter by pilot role (Captain/First Officer)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employee_id": "PX001",
      "first_name": "John",
      "last_name": "Smith",
      "role": "Captain",
      "commencement_date": "2015-03-15",
      "date_of_birth": "1985-06-20",
      "retirement_date": "2045-06-20",
      "is_active": true,
      "seniority_number": 1,
      "captain_qualifications": {
        "line_captain": true,
        "training_captain": false,
        "examiner": false
      },
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 27,
    "totalPages": 1
  }
}
```

### Get Single Pilot

```http
GET /api/pilots/{id}
```

**Path Parameters:**

- `id` (string): Pilot UUID

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "PX001",
    "first_name": "John",
    "last_name": "Smith",
    "role": "Captain",
    "commencement_date": "2015-03-15",
    "date_of_birth": "1985-06-20",
    "retirement_date": "2045-06-20",
    "is_active": true,
    "seniority_number": 1,
    "captain_qualifications": {
      "line_captain": true,
      "training_captain": false,
      "examiner": false
    },
    "pilot_checks": [
      {
        "id": "uuid",
        "check_type_id": "uuid",
        "check_date": "2024-06-15",
        "expiry_date": "2025-06-15",
        "status": "current",
        "check_types": {
          "check_code": "LPC",
          "check_description": "License Proficiency Check",
          "category": "Flight Checks"
        }
      }
    ]
  }
}
```

### Create Pilot

```http
POST /api/pilots
```

**Required Permission:** `pilot:create`

**Request Body:**

```json
{
  "employee_id": "PX028",
  "first_name": "Jane",
  "last_name": "Doe",
  "role": "First Officer",
  "commencement_date": "2024-10-01",
  "date_of_birth": "1990-08-15",
  "is_active": true,
  "captain_qualifications": {
    "line_captain": false,
    "training_captain": false,
    "examiner": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "PX028",
    "first_name": "Jane",
    "last_name": "Doe",
    "role": "First Officer",
    "commencement_date": "2024-10-01",
    "date_of_birth": "1990-08-15",
    "retirement_date": "2050-08-15",
    "is_active": true,
    "seniority_number": 28,
    "captain_qualifications": {
      "line_captain": false,
      "training_captain": false,
      "examiner": false
    },
    "created_at": "2024-10-01T12:00:00.000Z",
    "updated_at": "2024-10-01T12:00:00.000Z"
  }
}
```

### Update Pilot

```http
PUT /api/pilots/{id}
PATCH /api/pilots/{id}
```

**Required Permission:** `pilot:update`

**Path Parameters:**

- `id` (string): Pilot UUID

**Request Body:**

```json
{
  "role": "Captain",
  "is_active": true,
  "captain_qualifications": {
    "line_captain": true,
    "training_captain": false,
    "examiner": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "PX028",
    "first_name": "Jane",
    "last_name": "Doe",
    "role": "Captain",
    "is_active": true,
    "captain_qualifications": {
      "line_captain": true,
      "training_captain": false,
      "examiner": false
    },
    "updated_at": "2024-10-01T12:30:00.000Z"
  }
}
```

### Delete Pilot

```http
DELETE /api/pilots/{id}
```

**Required Permission:** `pilot:delete`

**Path Parameters:**

- `id` (string): Pilot UUID

**Response:**

```json
{
  "success": true,
  "message": "Pilot deleted successfully"
}
```

---

## Certifications API

### List Pilot Certifications

```http
GET /api/pilots/{pilotId}/certifications
```

**Path Parameters:**

- `pilotId` (string): Pilot UUID

**Query Parameters:**

- `status` (string, optional): Filter by status (current/expiring/expired)
- `category` (string, optional): Filter by category

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "pilot_id": "uuid",
      "check_type_id": "uuid",
      "check_date": "2024-06-15",
      "expiry_date": "2025-06-15",
      "status": "current",
      "days_until_expiry": 258,
      "check_types": {
        "id": "uuid",
        "check_code": "LPC",
        "check_description": "License Proficiency Check",
        "category": "Flight Checks",
        "validity_months": 12
      }
    }
  ]
}
```

### Get Expiring Certifications

```http
GET /api/certifications/expiring
```

**Query Parameters:**

- `days` (number, optional): Days ahead to check (default: 60)
- `pilot_id` (string, optional): Filter by specific pilot

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "pilot": {
        "id": "uuid",
        "first_name": "John",
        "last_name": "Smith",
        "employee_id": "PX001"
      },
      "check_type": {
        "check_code": "LPC",
        "check_description": "License Proficiency Check",
        "category": "Flight Checks"
      },
      "check_date": "2024-06-15",
      "expiry_date": "2025-06-15",
      "days_until_expiry": 30,
      "status": "expiring"
    }
  ],
  "count": 12
}
```

### Create Certification

```http
POST /api/certifications
```

**Required Permission:** `certification:create`

**Request Body:**

```json
{
  "pilot_id": "uuid",
  "check_type_id": "uuid",
  "check_date": "2024-10-01",
  "expiry_date": "2025-10-01"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "pilot_id": "uuid",
    "check_type_id": "uuid",
    "check_date": "2024-10-01",
    "expiry_date": "2025-10-01",
    "created_at": "2024-10-01T12:00:00.000Z"
  }
}
```

### Update Certification

```http
PUT /api/certifications/{id}
```

**Required Permission:** `certification:update`

**Request Body:**

```json
{
  "check_date": "2024-10-05",
  "expiry_date": "2025-10-05"
}
```

### Bulk Update Certifications

```http
POST /api/certifications/bulk
```

**Required Permission:** `certification:bulk_update`

**Request Body:**

```json
{
  "certifications": [
    {
      "id": "uuid",
      "check_date": "2024-10-01",
      "expiry_date": "2025-10-01"
    },
    {
      "id": "uuid",
      "check_date": "2024-10-02",
      "expiry_date": "2025-10-02"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "updated": 2,
  "failed": 0,
  "errors": []
}
```

---

## Leave Requests API

### List Leave Requests

```http
GET /api/leave
```

**Query Parameters:**

- `roster_period` (string, optional): Filter by roster period (e.g., RP11/2025)
- `status` (string, optional): Filter by status (pending/approved/rejected)
- `pilot_id` (string, optional): Filter by pilot

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "pilot_id": "uuid",
      "leave_type": "RDO",
      "start_date": "2025-10-05",
      "end_date": "2025-10-06",
      "days": 2,
      "roster_period": "RP11/2025",
      "status": "approved",
      "approved_by": "admin@example.com",
      "approved_at": "2025-09-30T10:00:00.000Z",
      "notes": "Family event",
      "pilot": {
        "first_name": "John",
        "last_name": "Smith",
        "employee_id": "PX001"
      }
    }
  ]
}
```

### Create Leave Request

```http
POST /api/leave
```

**Required Permission:** `leave:create`

**Request Body:**

```json
{
  "pilot_id": "uuid",
  "leave_type": "RDO",
  "start_date": "2025-10-15",
  "end_date": "2025-10-16",
  "roster_period": "RP11/2025",
  "notes": "Personal reasons"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "pilot_id": "uuid",
    "leave_type": "RDO",
    "start_date": "2025-10-15",
    "end_date": "2025-10-16",
    "days": 2,
    "roster_period": "RP11/2025",
    "status": "pending",
    "notes": "Personal reasons",
    "created_at": "2025-10-01T12:00:00.000Z"
  }
}
```

### Approve Leave Request

```http
POST /api/leave/{id}/approve
```

**Required Permission:** `leave:approve`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "approved_by": "manager@example.com",
    "approved_at": "2025-10-01T12:30:00.000Z"
  }
}
```

### Reject Leave Request

```http
POST /api/leave/{id}/reject
```

**Required Permission:** `leave:reject`

**Request Body:**

```json
{
  "reason": "Insufficient coverage for this period"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "rejected",
    "rejected_by": "manager@example.com",
    "rejected_at": "2025-10-01T12:30:00.000Z",
    "rejection_reason": "Insufficient coverage for this period"
  }
}
```

---

## Dashboard API

### Get Dashboard Statistics

```http
GET /api/dashboard/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "pilots": {
      "total": 27,
      "active": 25,
      "captains": 15,
      "firstOfficers": 12
    },
    "certifications": {
      "total": 568,
      "expiringSoon": 12,
      "expired": 3,
      "checkTypes": 36
    },
    "leave": {
      "pending": 5,
      "approved": 8,
      "thisRosterPeriod": 13
    },
    "compliance": {
      "overallRate": 96.5,
      "pilotsCompliant": 24,
      "pilotsNonCompliant": 3
    }
  }
}
```

### Get Compliance Report

```http
GET /api/dashboard/compliance
```

**Response:**

```json
{
  "success": true,
  "data": {
    "byPilot": [
      {
        "pilot_id": "uuid",
        "pilot_name": "John Smith",
        "employee_id": "PX001",
        "total_checks": 36,
        "current_checks": 34,
        "expiring_checks": 2,
        "expired_checks": 0,
        "compliance_rate": 94.4
      }
    ],
    "byCategory": [
      {
        "category": "Flight Checks",
        "total": 180,
        "current": 175,
        "expiring": 3,
        "expired": 2,
        "compliance_rate": 97.2
      }
    ]
  }
}
```

---

## Reports API

### Generate PDF Report

```http
POST /api/reports/generate
```

**Required Permission:** `reports:create`

**Request Body:**

```json
{
  "type": "certification_expiry",
  "format": "pdf",
  "parameters": {
    "days_ahead": 60,
    "include_expired": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "report_id": "uuid",
    "download_url": "/api/reports/download/uuid",
    "generated_at": "2025-10-01T12:00:00.000Z"
  }
}
```

### Export Data

```http
POST /api/reports/export
```

**Required Permission:** `reports:export`

**Request Body:**

```json
{
  "type": "pilots",
  "format": "csv",
  "filters": {
    "is_active": true,
    "role": "Captain"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "download_url": "/api/reports/download/export-uuid.csv",
    "record_count": 15,
    "generated_at": "2025-10-01T12:00:00.000Z"
  }
}
```

---

## Health Check API

### Basic Health Check

```http
GET /api/health?check=basic
```

**Response:**

```json
{
  "status": "healthy",
  "service": "Air Niugini Pilot Management System",
  "timestamp": "2025-10-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Detailed Health Check

```http
GET /api/health?check=detailed
```

**Response:**

```json
{
  "status": "healthy",
  "healthy": true,
  "timestamp": "2025-10-01T12:00:00.000Z",
  "checks": {
    "database": {
      "status": "healthy",
      "averageQueryTime": "45ms",
      "activeConnections": 5
    },
    "api": {
      "successRate": "98.5%",
      "averageResponseTime": "145ms"
    },
    "memory": {
      "used": "128 MB",
      "total": "512 MB",
      "percentage": "25%"
    },
    "uptime": {
      "seconds": 86400,
      "formatted": "1d"
    }
  },
  "issues": [],
  "warnings": []
}
```

---

## Webhooks API

### Register Webhook

```http
POST /api/webhooks
```

**Required Permission:** `system:webhooks`

**Request Body:**

```json
{
  "url": "https://api.example.com/webhooks",
  "events": ["certification.expiring", "leave.approved"],
  "description": "External system integration",
  "headers": {
    "X-API-Key": "your-api-key"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://api.example.com/webhooks",
    "secret": "webhook_secret_key",
    "events": ["certification.expiring", "leave.approved"],
    "active": true,
    "created_at": "2025-10-01T12:00:00.000Z"
  }
}
```

### Test Webhook

```http
POST /api/webhooks/{id}/test
```

**Response:**

```json
{
  "success": true,
  "responseTime": 145,
  "statusCode": 200
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Error Codes

- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired token
- `PERMISSION_DENIED` - Insufficient permissions
- `VALIDATION_ERROR` - Request validation failed
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_API_ERROR` - External service error

---

## Rate Limiting

- **Default Limit:** 100 requests per minute per user
- **Burst Limit:** 20 requests per second
- **Headers:**
  - `X-RateLimit-Limit` - Maximum requests per window
  - `X-RateLimit-Remaining` - Remaining requests in window
  - `X-RateLimit-Reset` - Timestamp when limit resets

---

## Versioning

API version is included in the response headers:

```http
X-API-Version: 1.0.0
```

Breaking changes will increment the major version. The current version will be maintained for at least 6 months after a new version is released.

---

## Support

For API support and questions:

- 📧 **Email:** api-support@airniugini.com.pg
- 📚 **Documentation:** https://docs.airniugini-pms.com
- 🐛 **Issues:** https://github.com/airniugini/pms/issues

---

**Document Version:** 1.0.0
**API Version:** 1.0.0
**Last Updated:** October 1, 2025

**Air Niugini B767 Pilot Management System**
