# Database Quick Start Guide

## 1. Initial Setup

```bash
# Copy environment file
cp .env.example .env

# Start PostgreSQL with pgvector
podman-compose up -d postgres

# Verify database is running
podman-compose ps
```

## 2. Verify pgvector Installation

```bash
# Check if pgvector extension is loaded
podman exec -it persona-bot-postgres psql -U postgres -d personabot -c "\dx"

# Expected output should include 'vector' extension
```

## 3. Test Vector Operations

```bash
# Run a simple vector test
podman exec -it persona-bot-postgres psql -U postgres -d personabot << 'EOF'
-- Test vector creation
SELECT '[1,2,3]'::vector;

-- Test vector dimensions
SELECT vector_dims('[1,2,3]'::vector);

-- Test cosine similarity
SELECT '[1,2,3]'::vector <=> '[4,5,6]'::vector as cosine_distance;
EOF
```

## 4. Common Commands

### Start/Stop Database
```bash
# Start database
podman-compose up -d postgres

# Stop database
podman-compose stop postgres

# View logs
podman-compose logs postgres

# Restart database
podman-compose restart postgres
```

### Database Management
```bash
# Connect to PostgreSQL
podman exec -it persona-bot-postgres psql -U postgres -d personabot

# Backup database
podman exec persona-bot-postgres pg_dump -U postgres personabot > backup.sql

# Restore database
podman exec -i persona-bot-postgres psql -U postgres personabot < backup.sql
```

## 5. Troubleshooting

### Port Already in Use
```bash
# Check what's using port 5432
sudo lsof -i :5432

# Stop conflicting service or change DB_PORT in .env
```

### Container Won't Start
```bash
# Check logs
podman-compose logs postgres

# Check volume permissions
podman volume ls

# Recreate container
podman-compose down -v
podman-compose up -d postgres
```

### pgvector Extension Missing
```bash
# Manually create extension
podman exec -it persona-bot-postgres psql -U postgres -d personabot -c "CREATE EXTENSION vector;"
```

## 6. Next Steps

After database setup:
1. Start backend - database tables auto-initialize: `cd backend && npm run dev`
2. Test backend connection: `curl http://localhost:3001/health`
3. Implement vector storage and retrieval (using pgvector)