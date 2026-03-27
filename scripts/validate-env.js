#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class FatalError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FatalError';
  }
}

/**
 * Simple environment loader to mimic Next.js behavior for the validation script.
 * Loads variables from .env files into process.env if they are not already set.
 */
function loadEnvironment() {
  const envFiles = [
    '.env.local',
    '.env.development',
    '.env'
  ];
  
  console.log('📂 Loading environment files...');
  
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      let count = 0;
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const k = key.trim();
          const v = valueParts.join('=').trim();
          // We only set it if it's not already in process.env
          if (k && process.env[k] === undefined) {
             process.env[k] = v;
             count++;
          }
        }
      });
      if (count > 0) {
        console.log(`   ✅ Loaded ${count} variables from ${file}`);
      }
    }
  });
  console.log('');
}

/**
 * Validates that all required environment variables from .env.example are present
 * in the current process.env
 */
function validateEnvironment() {
  // Load environment variables first
  loadEnvironment();
  
  console.log('🔍 Validating environment variables...\n');
  
  try {
    // Read .env.example file
    const envExamplePath = path.join(process.cwd(), '.env.example');
    
    if (!fs.existsSync(envExamplePath)) {
      throw new FatalError('❌ .env.example file not found in project root');
    }
    
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Parse .env.example to extract required variables
    const requiredVars = envExampleContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && line.includes('='))
      .map(line => line.split('=')[0].trim())
      .filter(key => key); // Remove empty strings
    
    console.log(`📋 Found ${requiredVars.length} required environment variables:`);
    requiredVars.forEach(key => console.log(`   - ${key}`));
    
    // Check which variables are missing
    const missingVars = requiredVars.filter(key => {
      const value = process.env[key];
      return value === undefined || value === '';
    });
    
    if (missingVars.length === 0) {
      console.log('\n✅ All required environment variables are present!');
      
      // Show current values (masked for sensitive data)
      console.log('\n📊 Current environment configuration:');
      requiredVars.forEach(key => {
        const value = process.env[key];
        const displayValue = value.includes('contract') || value.includes('key') || value.includes('secret')
          ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
          : value;
        console.log(`   ${key}=${displayValue}`);
      });
      
      return true;
    } else {
      console.log(`\n❌ Missing ${missingVars.length} required environment variables:`);
      missingVars.forEach(key => console.log(`   - ${key}`));
      
      throw new FatalError(`
🚨 FATAL: Environment validation failed!

Missing variables: ${missingVars.join(', ')}

To fix this issue:
1. Copy .env.example to .env: cp .env.example .env
2. Fill in the missing values in your .env file
3. Restart your development server

Required variables can be found in .env.example
      `);
    }
    
  } catch (error) {
    if (error instanceof FatalError) {
      console.error(error.message);
      process.exit(1);
    } else {
      console.error('❌ Unexpected error during environment validation:', error.message);
      process.exit(1);
    }
  }
}

/**
 * Validates environment for specific environment (development/production)
 */
function validateEnvironmentForBuild(isProduction = false) {
  console.log(`🏗️  Validating environment for ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}...\n`);
  
  // Additional production-specific checks
  if (isProduction) {
    const prodChecks = [
      {
        name: 'Network Configuration',
        check: () => {
          const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
          return network && ['mainnet', 'testnet'].includes(network);
        },
        message: 'NEXT_PUBLIC_STELLAR_NETWORK must be "mainnet" or "testnet"'
      },
      {
        name: 'Contract IDs',
        check: () => {
          const vault = process.env.NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID;
          const token = process.env.NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID;
          return vault && token && vault.length > 0 && token.length > 0;
        },
        message: 'Contract IDs must be provided for production builds'
      }
    ];
    
    for (const { name, check, message } of prodChecks) {
      if (!check()) {
        throw new FatalError(`
🚨 PRODUCTION VALIDATION FAILED: ${name}

${message}

Please ensure your production environment is properly configured.
        `);
      }
    }
    
    console.log('✅ Production-specific validation passed!');
  }
  
  // Run standard validation
  validateEnvironment();
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const isProduction = args.includes('--production') || args.includes('-p');
  
  validateEnvironmentForBuild(isProduction);
}

module.exports = {
  validateEnvironment,
  validateEnvironmentForBuild,
  FatalError
};
