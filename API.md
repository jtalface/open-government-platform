# API Documentation

## Overview

The Open Government Platform API is built with Next.js API Routes and follows REST principles. All endpoints return JSON and use standard HTTP status codes.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via NextAuth session cookies. The API uses JWT-based sessions.

### Sign In

```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "admin@lisboa.pt",
  "password": "demo123"
}
```

**Response:**
```json
{
  "url": "http://localhost:3000"
}
```

### Sign Out

```http
POST /api/auth/signout
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_1234567890_abc",
    "timestamp": "2026-01-14T12:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [ ... ]
  },
  "meta": {
    "requestId": "req_1234567890_xyz",
    "timestamp": "2026-01-14T12:00:00.000Z"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  },
  "meta": { ... }
}
```

## Endpoints

### Incidents

#### List Incidents

```http
GET /api/incidents
GET /api/incidents?categoryId=<uuid>
GET /api/incidents?status=OPEN
GET /api/incidents?neighborhoodId=<uuid>
GET /api/incidents?page=1&pageSize=20
```

**Query Parameters:**
- `categoryId` (string, optional): Filter by category
- `status` (string, optional): Filter by status (OPEN, TRIAGED, TICKETED, RESOLVED, CLOSED)
- `neighborhoodId` (string, optional): Filter by neighborhood
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "municipalityId": "uuid",
        "categoryId": "uuid",
        "title": "Lixo acumulado na Rua Augusta",
        "description": "Descrição detalhada...",
        "lat": 38.7078,
        "lng": -9.1369,
        "geohash": "ezjm6",
        "neighborhoodId": "uuid",
        "address": null,
        "status": "OPEN",
        "createdByUserId": "uuid",
        "media": [],
        "voteStats": {
          "total": 5,
          "upvotes": 4,
          "downvotes": 1,
          "byNeighborhood": {
            "uuid": { "upvotes": 3, "downvotes": 0 }
          }
        },
        "importanceScore": 2.5,
        "ticketId": null,
        "createdAt": "2026-01-12T10:00:00.000Z",
        "updatedAt": "2026-01-12T10:00:00.000Z",
        "category": {
          "id": "uuid",
          "name": "Saúde Pública",
          "icon": "health",
          "color": "#EF4444"
        },
        "createdBy": {
          "id": "uuid",
          "name": "Maria Silva",
          "image": null
        },
        "neighborhood": {
          "id": "uuid",
          "name": "Baixa"
        }
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

#### List Nearby Incidents

```http
GET /api/incidents?lat=38.7223&lng=-9.1393&radius=5000
```

**Query Parameters:**
- `lat` (number, required): Latitude
- `lng` (number, required): Longitude
- `radius` (number, optional): Radius in meters (default: 5000)

#### Get Incident

```http
GET /api/incidents/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "userVote": 1,  // Current user's vote (1, -1, or null)
    "ticket": {
      "id": "uuid",
      "title": "...",
      "status": "IN_PROGRESS",
      "updates": [
        {
          "id": "uuid",
          "message": "Equipe enviada para avaliação",
          "visibility": "PUBLIC",
          "createdAt": "2026-01-13T14:00:00.000Z",
          "author": {
            "id": "uuid",
            "name": "Manager Lisboa"
          }
        }
      ]
    },
    ...
  }
}
```

#### Create Incident

```http
POST /api/incidents
Content-Type: application/json
```

**Request Body:**
```json
{
  "categoryId": "uuid",
  "title": "Buraco na estrada",
  "description": "Buraco grande no asfalto em frente ao número 45. Perigoso para carros e motas.",
  "location": {
    "lat": 38.7139,
    "lng": -9.1286
  },
  "media": [
    {
      "url": "https://example.com/image.jpg",
      "type": "IMAGE"
    }
  ]
}
```

**Validation:**
- `categoryId`: Required, must be valid UUID
- `title`: Required, 5-200 characters
- `description`: Required, 10-2000 characters
- `location.lat`: Required, -90 to 90
- `location.lng`: Required, -180 to 180
- `media`: Optional array

**Response:** (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Buraco na estrada",
    ...
  }
}
```

#### Vote on Incident

```http
POST /api/incidents/:id/vote
Content-Type: application/json
```

**Request Body:**
```json
{
  "value": 1  // 1 for upvote, -1 for downvote
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

**Notes:**
- Voting is idempotent: voting again with the same value has no effect
- Voting with opposite value changes the vote
- Votes are weighted by neighborhood in importance scoring

#### Remove Vote

```http
DELETE /api/incidents/:id/vote
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

### Categories

#### List Categories

```http
GET /api/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "municipalityId": "uuid",
      "name": "Saúde Pública",
      "icon": "health",
      "color": "#EF4444",
      "description": "Questões de saúde pública e saneamento",
      "active": true,
      "sortOrder": 1,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### Tickets (Manager/Admin Only)

#### List Tickets

```http
GET /api/tickets
GET /api/tickets?status=IN_PROGRESS
GET /api/tickets?priority=HIGH
GET /api/tickets?assignedToUserId=<uuid>
```

**Note:** Implementation pending. Structure defined in schema.

**Query Parameters:**
- `status` (string, optional): Filter by status
- `priority` (string, optional): Filter by priority
- `assignedToUserId` (string, optional): Filter by assignee
- `page` (number, optional): Page number
- `pageSize` (number, optional): Items per page

#### Create Ticket

```http
POST /api/tickets
Content-Type: application/json
```

**Note:** Implementation pending.

**Request Body:**
```json
{
  "incidentId": "uuid",  // Optional
  "categoryId": "uuid",
  "title": "Reparar buraco na estrada",
  "description": "...",
  "priority": "HIGH",
  "assignedToUserId": "uuid",  // Optional
  "publicVisibility": "PUBLIC",
  "sla": {
    "dueDate": "2026-01-20T00:00:00.000Z",
    "estimatedHours": 8
  }
}
```

#### Update Ticket

```http
PATCH /api/tickets/:id
Content-Type: application/json
```

**Note:** Implementation pending.

**Request Body:**
```json
{
  "status": "DONE",
  "priority": "MEDIUM",
  "assignedToUserId": "uuid"
}
```

#### Add Ticket Update

```http
POST /api/tickets/:id/updates
Content-Type: application/json
```

**Note:** Implementation pending.

**Request Body:**
```json
{
  "message": "Trabalho concluído. Buraco reparado.",
  "visibility": "PUBLIC",
  "attachments": [
    {
      "url": "https://example.com/after.jpg",
      "type": "IMAGE"
    }
  ]
}
```

### Admin (Admin Only)

#### Update User Role

```http
POST /api/admin/users/:id/role
Content-Type: application/json
```

**Note:** Implementation pending.

**Request Body:**
```json
{
  "role": "MANAGER"
}
```

#### Create Category

```http
POST /api/admin/categories
Content-Type: application/json
```

**Note:** Implementation pending.

**Request Body:**
```json
{
  "name": "Transporte",
  "icon": "bus",
  "color": "#10B981",
  "description": "Questões de transporte público",
  "sortOrder": 5
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

**Note:** Not yet implemented. Recommended limits:

- Incident creation: 10 per hour per user
- Voting: 100 per hour per user
- API calls: 1000 per hour per IP

## Webhooks (Future)

**Note:** Not yet implemented.

Future webhook events:
- `incident.created`
- `incident.voted`
- `ticket.created`
- `ticket.updated`
- `ticket.completed`

## GraphQL Alternative (Future)

The current API uses REST. A GraphQL endpoint could be added at `/api/graphql` for more flexible querying.

## Testing

Use the provided Postman/Insomnia collection (to be created) or test with curl:

```bash
# Sign in and get cookies
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen1@example.com","password":"demo123"}' \
  -c cookies.txt

# List incidents (authenticated)
curl http://localhost:3000/api/incidents \
  -b cookies.txt

# Create incident (authenticated)
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "categoryId": "...",
    "title": "Test Incident",
    "description": "This is a test incident",
    "location": {"lat": 38.7223, "lng": -9.1393}
  }'
```

## Best Practices

1. **Always handle errors**: Check `success` field in response
2. **Use request IDs**: Include in error reports
3. **Respect rate limits**: Implement exponential backoff
4. **Cache responses**: Use React Query or similar
5. **Validate input**: Use Zod schemas on client side too

## SDK (Future)

A TypeScript SDK could be generated:

```typescript
import { OGPClient } from '@ogp/sdk';

const client = new OGPClient({ baseUrl: '...' });

await client.auth.signIn({ email, password });
const incidents = await client.incidents.list({ categoryId });
await client.incidents.vote(incidentId, 1);
```

