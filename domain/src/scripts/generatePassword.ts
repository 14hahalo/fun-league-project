import dotenv from 'dotenv';
dotenv.config();

import { hashPassword } from '../utils/password';

/**
 * Utility script to generate a hashed password
 * Usage: npx ts-node src/scripts/generatePassword.ts [password]
 * Example: npx ts-node src/scripts/generatePassword.ts admin123
 */

const generateHashedPassword = async () => {
  const password = process.argv[2];

  if (!password) {
    console.error('❌ Error: Please provide a password as an argument');
    console.log('Usage: npx ts-node src/scripts/generatePassword.ts [password]');
    console.log('Example: npx ts-node src/scripts/generatePassword.ts admin123');
    process.exit(1);
  }

  try {
    console.log('🔐 Generating hashed password...\n');
    const hashedPassword = await hashPassword(password);

    console.log('✅ Password hashed successfully!\n');
    console.log('Original Password:', password);
    console.log('Hashed Password:', hashedPassword);
    console.log('\n📋 You can now use this hashed password in Firebase Console or seed scripts.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating password:', error);
    process.exit(1);
  }
};

generateHashedPassword();
