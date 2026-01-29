import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/firebase';
import { PlayerRole } from '../models/Player';
import { hashPassword } from '../utils/password';

const ADMIN_DATA = {
  nickname: 'admin',
  email: 'admin@funleague.com',
  password: process.env.ADMINPASS, 
  firstName: 'Admin',
  lastName: 'User',
  role: PlayerRole.ADMIN,
  needsPasswordChange: false, 
  isActive: true,
};

const seedAdminUser = async () => {
  try {

    const playersCollection = db.collection('players');

    const adminQuery = await playersCollection
      .where('nickname', '==', ADMIN_DATA.nickname)
      .limit(1)
      .get();

    if (!adminQuery.empty) {
      process.exit(0);
    }

    // Admin de olsa o parola şifrelenecek
    const hashedPassword = await hashPassword(ADMIN_DATA.password!);

    await playersCollection.add({
      nickname: ADMIN_DATA.nickname,
      email: ADMIN_DATA.email,
      password: hashedPassword,
      role: ADMIN_DATA.role,
      needsPasswordChange: ADMIN_DATA.needsPasswordChange,
      firstName: ADMIN_DATA.firstName,
      lastName: ADMIN_DATA.lastName,
      photoUrl: null,
      jerseyNumber: null,
      position: null,
      isActive: ADMIN_DATA.isActive,
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });


    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

seedAdminUser();
