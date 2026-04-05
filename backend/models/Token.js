import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g. TMA001, TMAS001
  role: { type: String, enum: ['Teacher', 'Student'], required: true },
  isUsed: { type: Boolean, default: false },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branch: { type: String } // Optional branch mapping if pre-defined
}, { timestamps: true });

export default mongoose.model('Token', tokenSchema);
