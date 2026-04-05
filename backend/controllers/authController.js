import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Token from '../models/Token.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

export const registerUser = async (req, res) => {
  const { name, password, tokenCode, role, branch, faceEncodingId } = req.body;
  try {
    const userExists = await User.findOne({ tokenCode });
    if (userExists) return res.status(400).json({ message: 'User with this token already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      password: hashedPassword,
      role,
      tokenCode,
      branch,
      faceEncodingId,
      hasFaceCaptured: !!faceEncodingId,
      isActive: true
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { tokenCode, password } = req.body;
  try {
    const user = await User.findOne({ tokenCode });
    if (user && (await bcrypt.compare(password, user.password))) {
      
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account blocked by admin' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        role: user.role,
        branch: user.branch,
        faceEncodingId: user.faceEncodingId || null,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid token code or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
