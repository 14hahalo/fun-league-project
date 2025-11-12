import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/firebase';
import { PlayerRole } from '../models/Player';
import { hashPassword } from '../utils/password';

/**
 * Script to create an initial admin user
 * Usage: npx ts-node src/scripts/seedAdminUser.ts
 *
 * You can customize the admin details below
 */

const ADMIN_DATA = {
  nickname: 'admin',
  email: 'admin@funleague.com',
  password: 'admin123', // Change this to your desired admin password
  firstName: 'Admin',
  lastName: 'User',
  role: PlayerRole.ADMIN,
  needsPasswordChange: false, // Set to true if you want admin to change password on first login
  isActive: true,
};

const seedAdminUser = async () => {
  try {
    console.log('🌱 Starting admin user seed...\n');

    const playersCollection = db.collection('players');

    // Check if admin already exists
    const adminQuery = await playersCollection
      .where('nickname', '==', ADMIN_DATA.nickname)
      .limit(1)
      .get();

    if (!adminQuery.empty) {
      console.log('⚠️  Admin user already exists with nickname:', ADMIN_DATA.nickname);
      console.log('Skipping seed...');
      process.exit(0);
    }

    // Hash the admin password
    console.log('🔐 Hashing admin password...');
    const hashedPassword = await hashPassword(ADMIN_DATA.password);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminRef = await playersCollection.add({
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

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 Admin User Details:');
    console.log('  ID:', adminRef.id);
    console.log('  Nickname:', ADMIN_DATA.nickname);
    console.log('  Email:', ADMIN_DATA.email);
    console.log('  Password:', ADMIN_DATA.password);
    console.log('  Role:', ADMIN_DATA.role);
    console.log('  Needs Password Change:', ADMIN_DATA.needsPasswordChange);
    console.log('\n🚀 You can now login with these credentials!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdminUser();
