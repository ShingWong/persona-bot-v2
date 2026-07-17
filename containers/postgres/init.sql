-- =============================================================================
-- PostgreSQL initialization script - Enable pgvector extension
-- =============================================================================
-- This script runs automatically on first container start
-- =============================================================================

-- Enable pgvector extension for vector embeddings (AI/ML)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create pgvector_hnsw extension for faster similarity search (optional)
-- CREATE EXTENSION IF NOT EXISTS vector_hnsw;

-- Set up performance optimizations for vector operations
ALTER SYSTEM SET shared_preload_libraries = 'vector';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Create test schema for verification
CREATE SCHEMA IF NOT EXISTS test;

-- Create a test table to verify vector operations work
CREATE TABLE IF NOT EXISTS test.vector_test (
    id SERIAL PRIMARY KEY,
    embedding vector(3),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data for testing
INSERT INTO test.vector_test (embedding, content) VALUES
    ('[1,2,3]', 'Test vector 1'),
    ('[4,5,6]', 'Test vector 2'),
    ('[7,8,9]', 'Test vector 3')
ON CONFLICT DO NOTHING;

-- Verify extensions are installed
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- Display vector test data
SELECT 'Vector extension test:' as test;
SELECT id, content, embedding::text, created_at FROM test.vector_test LIMIT 3;

-- Test vector operations
SELECT 'Vector operations test:' as test;
SELECT 
    'Cosine distance between [1,2,3] and [4,5,6]: ' || 
    (('[1,2,3]'::vector <=> '[4,5,6]'::vector)::text) as result;

-- Clean up test schema (optional - keeps test data for verification)
-- DROP SCHEMA test CASCADE;
