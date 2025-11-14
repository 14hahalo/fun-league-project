import dotenv from 'dotenv';
dotenv.config();

import { hashPassword } from '../utils/password';

const generateHashedPassword = async () => {
  const password = process.argv[2];

  if (!password) {
    process.exit(1);
  }

  try {
    await hashPassword(password);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

generateHashedPassword();
