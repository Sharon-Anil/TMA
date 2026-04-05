import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './utils/db.js';

dotenv.config();

const seedAdmin = async () => {
  await connectDB();
  try {
    const existing = await User.findOne({ tokenCode: 'admin' });
    if (existing) {
      console.log('Admin already exists. Updating password...');
      existing.password = await bcrypt.hash('TMA@2580', 10);
      await existing.save();
      console.log('Admin password updated!');
    } else {
      const hashedPassword = await bcrypt.hash('TMA@2580', 10);
      await User.create({
        name: 'System Admin',
        password: hashedPassword,
        role: 'Admin',
        tokenCode: 'admin',
        branch: 'All',
        isActive: true
      });
      console.log('Admin account created! Login: tokenCode=admin, password=TMA@2580');
    }
  } catch (err) {
    console.error('Error seeding admin:', err.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seedAdmin();
