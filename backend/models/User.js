import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Teacher', 'Student'], required: true },
  tokenCode: { type: String, required: true, unique: true }, // Unique login token
  branch: { 
    type: String, 
    enum: ['HSE Engineering', 'General Duty Assistant', 'Hospital Administration', 'Ethical Hacking', 'SOC Analyst', 'All'], 
    required: true 
  },
  hasFaceCaptured: { type: Boolean, default: false },
  faceEncodingId: { type: String }, // Reference to face encoding data
  isActive: { type: Boolean, default: true } // Admin can block/unblock users
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
