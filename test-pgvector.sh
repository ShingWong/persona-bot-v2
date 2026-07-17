#!/bin/bash

# Test pgvector functionality in PostgreSQL
# This script demonstrates vector operations

set -e

echo "🧪 Testing pgvector functionality"
echo "================================="

# Check if database is running
if ! podman-compose ps | grep -q "persona-bot-postgres.*Up"; then
    echo "⚠ PostgreSQL container is not running"
    echo "Starting PostgreSQL..."
    podman-compose up -d postgres
    sleep 5
fi

echo ""
echo "📊 Testing vector operations..."
echo "-----------------------------"

# Test 1: Check if pgvector extension is installed
echo "Test 1: Checking pgvector extension..."
podman exec -it persona-bot-postgres psql -U postgres -d personabot -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"

# Test 2: Basic vector operations
echo ""
echo "Test 2: Basic vector operations..."
podman exec -it persona-bot-postgres psql -U postgres -d personabot << 'EOF'
-- Create a test table
CREATE TABLE IF NOT EXISTS vector_demo (
    id SERIAL PRIMARY KEY,
    name TEXT,
    embedding vector(3)
);

-- Insert some vectors
INSERT INTO vector_demo (name, embedding) VALUES
    ('apple', '[0.1, 0.2, 0.3]'),
    ('banana', '[0.4, 0.5, 0.6]'),
    ('orange', '[0.7, 0.8, 0.9]')
ON CONFLICT DO NOTHING;

-- Query all vectors
SELECT * FROM vector_demo;

-- Find similar vectors to apple
SELECT 
    name,
    embedding <=> '[0.1, 0.2, 0.3]'::vector as distance,
    1 - (embedding <=> '[0.1, 0.2, 0.3]'::vector) as similarity
FROM vector_demo
ORDER BY distance ASC;

-- Clean up
DROP TABLE vector_demo;
EOF

# Test 3: Vector dimensions and operations
echo ""
echo "Test 3: Vector dimensions and operations..."
podman exec -it persona-bot-postgres psql -U postgres -d personabot << 'EOF'
-- Test vector dimensions
SELECT vector_dims('[1,2,3,4,5]'::vector) as dimensions;

-- Test vector addition
SELECT ('[1,2,3]'::vector + '[4,5,6]'::vector)::text as vector_addition;

-- Test vector subtraction  
SELECT ('[4,5,6]'::vector - '[1,2,3]'::vector)::text as vector_subtraction;

-- Test vector multiplication by scalar
SELECT ('[1,2,3]'::vector * 2)::text as vector_scalar_multiplication;

-- Test Euclidean distance (L2)
SELECT '[1,2,3]'::vector <-> '[4,5,6]'::vector as euclidean_distance;

-- Test inner product
SELECT '[1,2,3]'::vector <#> '[4,5,6]'::vector as inner_product;
EOF

echo ""
echo "✅ pgvector tests completed successfully!"
echo ""
echo "📈 Performance considerations for production:"
echo "1. Create HNSW indexes for faster similarity search"
echo "2. Adjust PostgreSQL memory settings for vector operations"
echo "3. Use appropriate vector dimensions for your embedding model"
echo ""
echo "Example HNSW index creation:"
echo "  CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);"