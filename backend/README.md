# DS Forest Backend API

Local backend server for DS Forest application.

## Tech Stack

- Node.js + TypeScript
- Express.js
- Prisma ORM
- SQLite (local development)
- JWT Authentication
- bcryptjs for password hashing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# .env file is already created with defaults
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-this-in-production"
PORT=3001
```

3. Run database migrations:
```bash
npm run prisma:migrate
```

4. Start development server:
```bash
npm run dev
```

The server will start on http://localhost:3001

## API Endpoints

### Authentication

**POST /api/auth/register**
- Register a new user
- Body: `{ email, password, name }`
- Returns: `{ token, user: { id, email, name } }`

**POST /api/auth/login**
- Login existing user
- Body: `{ email, password }`
- Returns: `{ token, user: { id, email, name } }`

### Projects (Requires Authentication)

**GET /api/projects**
- Get all projects for authenticated user
- Headers: `Authorization: Bearer <token>`
- Returns: Array of projects with nodes and edges

**GET /api/projects/:id**
- Get single project
- Headers: `Authorization: Bearer <token>`
- Returns: Project with nodes and edges

**POST /api/projects**
- Create new project
- Headers: `Authorization: Bearer <token>`
- Body: `{ name, description? }`
- Returns: Created project

**PUT /api/projects/:id**
- Update project
- Headers: `Authorization: Bearer <token>`
- Body: `{ name?, description? }`
- Returns: Updated project

**DELETE /api/projects/:id**
- Delete project
- Headers: `Authorization: Bearer <token>`
- Returns: `{ message: "Project deleted" }`

### Nodes (Requires Authentication)

**POST /api/nodes**
- Create new node
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "projectId": "string",
  "type": "start|solution|experiment|decision|end",
  "label": "string",
  "description": "string?",
  "x": number,
  "y": number,
  "effort": number (1-10),
  "value": number (1-10),
  "priority": "low|medium|high|critical",
  "status": "todo|in_progress|review|done",
  "assignees": ["string"],
  "tags": ["string"],
  "dueDate": "string?"
}
```

**PUT /api/nodes/:id**
- Update node
- Headers: `Authorization: Bearer <token>`
- Body: Same as create (all fields optional)
- Returns: Updated node

**DELETE /api/nodes/:id**
- Delete node
- Headers: `Authorization: Bearer <token>`
- Returns: `{ message: "Node deleted" }`

### Edges (Requires Authentication)

**POST /api/edges**
- Create edge/connection between nodes
- Headers: `Authorization: Bearer <token>`
- Body: `{ projectId, fromId, toId }`
- Returns: Created edge

**DELETE /api/edges/:id**
- Delete edge
- Headers: `Authorization: Bearer <token>`
- Returns: `{ message: "Edge deleted" }`

### Health Check

**GET /health**
- Check if server is running
- No authentication required
- Returns: `{ status: "ok", message: "DS Forest API is running" }`

## Database Schema

### User
- id (UUID)
- email (unique)
- password (hashed)
- name
- createdAt, updatedAt

### Project
- id (UUID)
- name
- description
- userId (foreign key)
- createdAt, updatedAt

### Node
- id (UUID)
- type (start, solution, experiment, decision, end)
- label
- description
- x, y (position)
- effort (1-10)
- value (1-10)
- priority (low, medium, high, critical)
- status (todo, in_progress, review, done)
- assignees (JSON array)
- tags (JSON array)
- dueDate
- projectId (foreign key)
- createdAt, updatedAt

### Edge
- id (UUID)
- fromId (node ID)
- toId (node ID)
- projectId (foreign key)
- createdAt

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations

## Testing the API

You can test the API using curl, Postman, or any HTTP client.

Example:
```bash
# Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create a project (use token from login)
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"My Project","description":"Test project"}'
```
