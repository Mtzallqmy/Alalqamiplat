import express from 'express';
import { SignJWT } from 'jose';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

// Mobile Auth Login
app.post('/api/mobile/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Simple validation (In a real app, check against DB)
  if (email === 'admin@example.com' && password === 'password123') {
    const user = {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin'
    };

    const token = await new SignJWT({ ...user })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    return res.json({
      success: true,
      token,
      user
    });
  }

  return res.status(401).json({
    success: false,
    error: "Invalid credentials"
  });
});

// Mock Admin Stats
app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      postsCount: 12,
      categoriesCount: 5,
      viewsCount: 1250
    }
  });
});

// Mock Admin Posts
app.get('/api/admin/posts', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', title: 'أول مقال', slug: 'first-post', status: 'published' },
      { id: '2', title: 'ثاني مقال', slug: 'second-post', status: 'draft' }
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
