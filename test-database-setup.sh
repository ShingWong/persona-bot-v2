#!/bin/bash

# Test script for PostgreSQL + pgvector setup
# This script verifies the database configuration and pgvector functionality

set -e

echo "🔍 Testing PostgreSQL + pgvector setup for persona-bot-v2"
echo "========================================================"

# Check if .env file exists
if [ -f .env ]; then
    echo "✓ .env file found"
    source .env
else
    echo "⚠ .env file not found, using defaults"
    export PROJECT_NAME="persona-bot"
    export DB_USER="postgres"
    export DB_PASSWORD="postgres"
    export DB_NAME="personabot"
    export DB_PORT="5432"
fi

echo ""
echo "📦 Checking container configuration..."
echo "------------------------------------"

# Check docker-compose.yml
if [ -f docker-compose.yml ]; then
    echo "✓ docker-compose.yml found"
    
    # Check PostgreSQL service configuration
    if grep -q "pgvector/pgvector" docker-compose.yml; then
        echo "✓ PostgreSQL with pgvector image configured"
    else
        echo "✗ PostgreSQL pgvector image not found in docker-compose.yml"
        exit 1
    fi
    
    # Check init script
    if grep -q "init.sql" docker-compose.yml; then
        echo "✓ Database initialization script configured"
    else
        echo "✗ Database initialization script not configured"
        exit 1
    fi
else
    echo "✗ docker-compose.yml not found"
    exit 1
fi

echo ""
echo "📁 Checking initialization scripts..."
echo "-----------------------------------"

# Check init.sql
if [ -f "containers/postgres/init.sql" ]; then
    echo "✓ init.sql found at containers/postgres/init.sql"
    
    # Check if pgvector extension is enabled
    if grep -q "CREATE EXTENSION.*vector" containers/postgres/init.sql; then
        echo "✓ pgvector extension creation configured"
    else
        echo "✗ pgvector extension not configured in init.sql"
        exit 1
    fi
else
    echo "✗ init.sql not found"
    exit 1
fi

echo ""
echo "🔧 Checking backend configuration..."
echo "----------------------------------"

# Check Prisma schema
if [ -f "backend/prisma/schema.prisma" ]; then
    echo "✓ Prisma schema found"
    
    # Check if vector fields are defined
    if grep -q "vector" backend/prisma/schema.prisma; then
        echo "✓ Vector fields defined in Prisma schema"
    else
        echo "⚠ Vector fields not found in Prisma schema (may be added later)"
    fi
else
    echo "⚠ Prisma schema not found (backend may not be fully configured)"
fi

echo ""
echo "✅ Database setup verification complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the database: podman-compose up -d postgres"
echo "2. Verify pgvector extension: podman exec -it \${PROJECT_NAME}-postgres psql -U postgres -c '\dx'"
echo "3. Test vector operations: podman exec -it \${PROJECT_NAME}-postgres psql -U postgres -c 'SELECT vector_dims(\"[1,2,3]\");'"
echo ""
echo "📝 For detailed setup instructions, see .orchestration/outputs/s0-2-database.md"