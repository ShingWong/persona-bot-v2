import dotenv from 'dotenv';
import { prisma } from '../src/lib/prisma';

dotenv.config();

async function seedDefaultAIModels() {
  console.log('🌱 Seeding default AI models...');

  const defaultModels = [
    {
      provider: 'openai',
      modelIdentifier: 'gpt-4',
      displayName: 'GPT-4',
      capabilities: ['chat', 'streaming', 'function_calling'],
      parameters: JSON.stringify({
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
      costPer1kInput: 0.03,
      costPer1kOutput: 0.06,
      isDefault: true,
      isActive: true,
    },
    {
      provider: 'openai',
      modelIdentifier: 'gpt-4-turbo',
      displayName: 'GPT-4 Turbo',
      capabilities: ['chat', 'streaming', 'function_calling'],
      parameters: JSON.stringify({
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
      costPer1kInput: 0.01,
      costPer1kOutput: 0.03,
      isDefault: false,
      isActive: true,
    },
    {
      provider: 'openai',
      modelIdentifier: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      capabilities: ['chat', 'streaming'],
      parameters: JSON.stringify({
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
      costPer1kInput: 0.0005,
      costPer1kOutput: 0.0015,
      isDefault: false,
      isActive: true,
    },
    {
      provider: 'anthropic',
      modelIdentifier: 'claude-3-opus',
      displayName: 'Claude 3 Opus',
      capabilities: ['chat', 'streaming'],
      parameters: JSON.stringify({
        temperature: 0.7,
        max_tokens: 1000,
      }),
      costPer1kInput: 0.015,
      costPer1kOutput: 0.075,
      isDefault: false,
      isActive: true,
    },
    {
      provider: 'anthropic',
      modelIdentifier: 'claude-3-sonnet',
      displayName: 'Claude 3 Sonnet',
      capabilities: ['chat', 'streaming'],
      parameters: JSON.stringify({
        temperature: 0.7,
        max_tokens: 1000,
      }),
      costPer1kInput: 0.003,
      costPer1kOutput: 0.015,
      isDefault: false,
      isActive: true,
    },
    {
      provider: 'google',
      modelIdentifier: 'gemini-pro',
      displayName: 'Gemini Pro',
      capabilities: ['chat', 'streaming'],
      parameters: JSON.stringify({
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.95,
        top_k: 40,
      }),
      costPer1kInput: 0.000125,
      costPer1kOutput: 0.000375,
      isDefault: false,
      isActive: true,
    },
    {
      provider: 'ollama',
      modelIdentifier: 'llama2',
      displayName: 'Llama 2 (Ollama)',
      endpoint: 'http://localhost:11434',
      capabilities: ['chat', 'streaming'],
      parameters: JSON.stringify({
        temperature: 0.7,
        num_predict: 1000,
        top_p: 0.9,
        top_k: 40,
      }),
      isDefault: false,
      isActive: true,
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const modelData of defaultModels) {
    // Check if model already exists
    const existing = await prisma.aIModel.findFirst({
      where: {
        provider: modelData.provider,
        modelIdentifier: modelData.modelIdentifier,
      },
    });

    if (existing) {
      console.log(`⚠️  Model "${modelData.provider}/${modelData.modelIdentifier}" already exists, skipping...`);
      skippedCount++;
      continue;
    }

    const model = await prisma.aIModel.create({
      data: modelData,
    });

    console.log(`✅ Created model: ${model.provider}/${model.modelIdentifier} (${model.id})`);
    createdCount++;
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   Created: ${createdCount} new models`);
  console.log(`   Skipped: ${skippedCount} existing models`);
}

async function main() {
  try {
    await seedDefaultAIModels();
  } catch (error) {
    console.error('❌ Error seeding AI models:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();