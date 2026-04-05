import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Token from './models/Token.js';
import connectDB from './utils/db.js';

dotenv.config();

const seedTokens = async () => {
  await connectDB();

  const tokens = [
    { code: 'STU001', role: 'Student' },
    { code: 'STU002', role: 'Student' },
    { code: 'TEA001', role: 'Teacher' },
  ];

  try {
    for (const t of tokens) {
      const exists = await Token.findOne({ code: t.code });
      if (!exists) {
        await Token.create(t);
        console.log(`Created token: ${t.code}`);
      } else {
        console.log(`Token ${t.code} already exists.`);
      }
    }
    console.log("Token seeding complete!");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seedTokens();
