import Token from '../models/Token.js';

export const generateTokens = async (req, res) => {
  const { count, role, branch } = req.body;
  
  if (role === 'Student' && !branch) {
    return res.status(400).json({ message: 'Branch is required for student tokens' });
  }

  try {
    const tokens = [];
    const prefix = role === 'Student' ? 'TMAS' : 'TMA';
    
    for(let i=0; i<count; i++) {
        const uniqueString = Math.random().toString(36).substring(2, 8).toUpperCase();
        tokens.push({
            code: `${prefix}-${uniqueString}`,
            role,
            branch: role === 'Student' ? branch : null
        });
    }

    const createdTokens = await Token.insertMany(tokens);
    res.status(201).json(createdTokens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTokens = async (req, res) => {
  try {
    const tokens = await Token.find().sort({ createdAt: -1 }).populate('assignedUser', 'name');
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
