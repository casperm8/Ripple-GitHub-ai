const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');

const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const referralCodeRoutes = require('./routes/referralCodes');
const userRoutes = require('./routes/users');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/referral-codes', referralCodeRoutes);
app.use('/api/users', userRoutes);

// Socket.io connection and real-time events
const userSockets = new Map();

// Require a valid JWT for every socket connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Register the authenticated user's socket (userId comes from verified token)
  socket.on('user-online', () => {
    const userId = socket.data.userId;
    userSockets.set(userId, socket.id);
    io.emit('user-status', { userId, status: 'online' });
  });

  // Broadcast new code creation
  socket.on('code-created', (data) => {
    io.emit('new-code', data);
  });

  // Broadcast code update
  socket.on('code-updated', (data) => {
    io.emit('code-changed', data);
  });

  // Notify follow action — followerId is taken from the verified token, not client input
  socket.on('user-followed', (data) => {
    const targetSocket = userSockets.get(data.targetUserId);
    if (targetSocket) {
      io.to(targetSocket).emit('follower-notification', {
        followerId: socket.data.userId,
        followerName: data.followerName
      });
    }
  });

  // Code view notification
  socket.on('code-viewed', (data) => {
    io.emit('code-view-count', { codeId: data.codeId, views: data.views });
  });

  // Code share notification
  socket.on('code-shared', (data) => {
    io.emit('code-share-count', { codeId: data.codeId, shares: data.shares });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const userId = socket.data.userId;
    if (userId && userSockets.get(userId) === socket.id) {
      userSockets.delete(userId);
      io.emit('user-status', { userId, status: 'offline' });
    }
  });
});

// MongoDB Connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;
