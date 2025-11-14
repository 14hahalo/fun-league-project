import dotenv from 'dotenv';
dotenv.config();

import { hashPassword } from '../utils/password';

const generateHashedPassword = async () => {
  const password = process.argv[2];

  if (!password) {
    process.exit(1);
  }

  try {
    const hashedPassword = await hashPassword(password);
    console.log('Hashed password:', hashedPassword);
    process.exit(0);
  } catch (error) {
    console.error('Error generating password:', error);
    process.exit(1);
  }
};

generateHashedPassword();
