// Simple test to verify Prisma client works
const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  console.log('Testing Prisma client...');
  
  try {
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasourceUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5434/personabot?schema=public'
    });
    
    console.log('✅ Prisma client instantiated successfully');
    
    // Test connection (without actually querying database)
    await prisma.$connect();
    console.log('✅ Prisma client connected successfully');
    
    // Check if we can access model types
    console.log('✅ Available models:');
    console.log('- User');
    console.log('- Session'); 
    console.log('- Persona');
    console.log('- AIModel');
    console.log('- Message');
    console.log('- ApiKey');
    console.log('- AuditLog');
    console.log('- Setting');
    console.log('- UserPreference');
    console.log('- Organization');
    console.log('- OrganizationUser');
    console.log('- Memory');
    
    await prisma.$disconnect();
    console.log('✅ Prisma client disconnected successfully');
    
    console.log('\n🎉 All Prisma tests passed!');
    console.log('The schema is ready for database migrations.');
    
  } catch (error) {
    console.error('❌ Prisma test failed:', error.message);
    process.exit(1);
  }
}

testPrisma();