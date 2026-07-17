# S0.2: PostgreSQL + pgvector Database Setup

## Overview
This document outlines the PostgreSQL database setup with pgvector extension for the persona-bot-v2 project. The database is configured to run in a containerized environment using Podman/Docker.

## Architecture

### Container Configuration
- **Image**: `pgvector/pgvector:pg16` (PostgreSQL 16 with pgvector pre-installed)
- **Port**: 5432 (configurable via `DB_PORT` environment variable)
- **Volume**: Persistent storage at `/var/lib/postgresql/data`
- **Network**: Connected to `app-network` for internal service communication

### Database Configuration
- **Database**: `personabot` (configurable via `DB_NAME`)
- **User**: `postgres` (configurable via `DB_USER`)
- **Password**: `postgres` (configurable via `DB_PASSWORD`)

## Setup Files

### 1. Docker/Podman Compose Configuration
**File**: `docker-compose.yml`
```yaml
postgres:
  image: pgvector/pgvector:pg16
  container_name: ${PROJECT_NAME:-persona-bot}-postgres
  restart: unless-stopped
  environment:
    POSTGRES_USER: ${DB_USER:-postgres}
    POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    POSTGRES_DB: ${DB_NAME:-personabot}
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./containers/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
  ports:
    - "${DB_PORT:-5432}:5432"
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - app-network
```

### 2. Database Initialization Script
**File**: `containers/postgres/init.sql`
```sql
-- =============================================================================
# PostgreSQL initialization script - Enable pgvector extension
# =============================================================================
# This script runs automatically on first container start
# =============================================================================

-- Enable pgvector extension for vector embeddings (AI/ML)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create pgvector_hnsw extension for faster similarity search (optional)
-- CREATE EXTENSION IF NOT EXISTS vector_hnsw;

-- Verify extensions are installed
\dx

-- Optional: Create indexes for common queries
-- Will be created via Prisma migrations
```

### 3. Environment Variables
Create a `.env` file in the project root with the following variables:
```bash
# Database Configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=personabot
DB_PORT=5432

# Project Configuration
PROJECT_NAME=persona-bot
NODE_ENV=development

# Backend Configuration
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Redis Configuration
REDIS_PORT=6379

# Optional: LLM Configuration
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_GEMINI_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
```

## Installation & Setup

### 1. Start the Database
```bash
# Using Podman Compose
podman-compose up -d postgres

# Or using Docker Compose
docker-compose up -d postgres
```

### 2. Verify Database Health
```bash
# Check container status
podman-compose ps

# Check database health
podman exec -it ${PROJECT_NAME}-postgres pg_isready -U postgres
```

### 3. Verify pgvector Extension
```bash
# Connect to PostgreSQL and check extensions
podman exec -it ${PROJECT_NAME}-postgres psql -U postgres -d personabot -c "\dx"

# Expected output should include:
#                  List of installed extensions
#   Name   | Version |   Schema   |         Description          
# ---------+---------+------------+------------------------------
#  plpgsql | 1.0     | pg_catalog | PL/pgSQL procedural language
#  vector  | 0.7.0   | public     | vector data type and similarity search
```

### 4. Test pgvector Functionality
```bash
# Test vector operations
podman exec -it ${PROJECT_NAME}-postgres psql -U postgres -d personabot << EOF
-- Create a test table with vector column
CREATE TABLE IF NOT EXISTS test_vectors (
    id SERIAL PRIMARY KEY,
    embedding vector(3),
    content TEXT
);

-- Insert test vectors
INSERT INTO test_vectors (embedding, content) VALUES
    ('[1,2,3]', 'First vector'),
    ('[4,5,6]', 'Second vector'),
    ('[7,8,9]', 'Third vector');

-- Query vectors
SELECT * FROM test_vectors;

-- Calculate cosine similarity
SELECT 
    content,
    1 - (embedding <=> '[1,2,3]') as similarity
FROM test_vectors
ORDER BY similarity DESC;

-- Clean up
DROP TABLE test_vectors;
EOF
```

## Prisma Integration

### Schema Configuration
The backend Prisma schema (`backend/prisma/schema.prisma`) includes vector field support:

```prisma
// Example vector field in Prisma schema
model VectorMemory {
  id        String   @id @default(cuid())
  content   String
  embedding Unsupported("vector(1536)")?  // Adjust dimension based on model
  // ... other fields
}
```

### Database Migrations
After setting up the database, run Prisma migrations:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

## Testing

### Run Verification Script
```bash
./test-database-setup.sh
```

### Manual Testing Commands
1. **Check container logs**: `podman-compose logs postgres`
2. **Test connection from backend**: Configure DATABASE_URL and test connection
3. **Verify pgvector functions**: Test vector similarity searches

## Troubleshooting

### Common Issues

1. **Container fails to start**:
   - Check if port 5432 is already in use: `sudo lsof -i :5432`
   - Verify Podman/Docker is running: `podman version`

2. **pgvector extension not loading**:
   - Check init.sql syntax: `cat containers/postgres/init.sql`
   - Manually create extension: `CREATE EXTENSION vector;`

3. **Connection refused**:
   - Verify container is running: `podman-compose ps`
   - Check health status: `podman-compose logs postgres | grep -i "ready"`

4. **Permission issues with volumes**:
   - Check volume permissions: `podman volume ls`
   - Recreate volumes if needed: `podman-compose down -v`

### Debug Commands
```bash
# View container logs
podman-compose logs postgres

# Enter container shell
podman exec -it ${PROJECT_NAME}-postgres bash

# Check PostgreSQL logs
podman exec -it ${PROJECT_NAME}-postgres cat /var/log/postgresql/postgresql-16-main.log

# Test database connection
podman exec -it ${PROJECT_NAME}-postgres psql -U postgres -c "SELECT version();"
```

## Performance Considerations

### Vector Dimensions
- **OpenAI text-embedding-3-small**: `vector(1536)`
- **OpenAI text-embedding-ada-002**: `vector(1536)`
- **Custom models**: Adjust dimension based on model output

### Indexing Strategies
For production use, consider adding HNSW indexes:
```sql
-- Create HNSW index for faster similarity search
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);
```

### Memory Configuration
Adjust PostgreSQL memory settings in `postgresql.conf` for vector operations:
```ini
shared_buffers = 256MB
work_mem = 16MB
maintenance_work_mem = 64MB
```

## Next Steps

1. **Run Prisma migrations** to create database schema
2. **Test backend connection** with DATABASE_URL environment variable
3. **Implement vector operations** in the application layer
4. **Set up database backups** for production deployment

## References
- [pgvector GitHub Repository](https://github.com/pgvector/pgvector)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Vector Support](https://www.prisma.io/docs/orm/prisma-schema/data-model/models#unsupported-types)