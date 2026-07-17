// Simple test to verify provider implementations
console.log('Testing LLM Provider Implementations...\n');

// Test Mock Provider
const { MockProvider } = require('./dist/services/llm/providers/mock.service');
const { OpenAIProvider } = require('./dist/services/llm/providers/openai.service');
const { AnthropicProvider } = require('./dist/services/llm/providers/anthropic.service');
const { GeminiProvider } = require('./dist/services/llm/providers/gemini.service');
const { OpenRouterProvider } = require('./dist/services/llm/providers/openrouter.service');
const { OllamaProvider } = require('./dist/services/llm/providers/ollama.service');

async function testProvider(providerName, ProviderClass) {
  console.log(`Testing ${providerName}...`);
  
  try {
    const provider = new ProviderClass();
    
    // Test initialization
    provider.initialize({
      apiKey: 'test-key',
      baseURL: 'http://test.local',
    });
    
    console.log(`  ✓ ${providerName} initialized successfully`);
    
    // Test getAvailableModels (async)
    const models = await provider.getAvailableModels();
    console.log(`  ✓ ${providerName} getAvailableModels: ${models.length} models`);
    
    return true;
  } catch (error) {
    console.log(`  ✗ ${providerName} failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('Running provider tests...\n');
  
  const tests = [
    ['Mock Provider', MockProvider],
    ['OpenAI Provider', OpenAIProvider],
    ['Anthropic Provider', AnthropicProvider],
    ['Google Gemini Provider', GeminiProvider],
    ['OpenRouter Provider', OpenRouterProvider],
    ['Ollama Provider', OllamaProvider],
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, ProviderClass] of tests) {
    const success = await testProvider(name, ProviderClass);
    if (success) passed++;
    else failed++;
    console.log();
  }
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All provider tests passed!');
  } else {
    console.log('❌ Some provider tests failed');
    process.exit(1);
  }
}

// Check if we're running in test mode
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };