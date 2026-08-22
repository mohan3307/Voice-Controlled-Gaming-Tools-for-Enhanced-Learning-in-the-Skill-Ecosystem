import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import winston from 'winston';

// Routes imports
import authRoutes from './routes/auth';
import skillRoutes from './routes/skills';
import gameRoutes from './routes/games';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';

// Middleware imports
import { apiLimiter } from './middleware/rateLimiter';

dotenv.config();

// Logger configurations
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

const app = express();
const server = http.createServer(app);

// Socket.IO Server configuration with cross origin options
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voice-skill-ecosystem';

// Security and json parsing middleware
app.use(helmet({
  contentSecurityPolicy: false // disable if conflicts with browser tools
}));
app.use(cors());
app.use(express.json());

// API Throttling
app.use('/api', apiLimiter);

// Database connection
mongoose.connect(MONGO_URI)
  .then(() => logger.info('MongoDB connected successfully'))
  .catch((err) => logger.error('MongoDB database connection error: ', err));

// Expose Health probe
app.get('/health', (req, res) => {
  res.json({ status: 'OK', environment: process.env.NODE_ENV || 'development', db: mongoose.connection.readyState });
});

// REST API Mappings
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO Multiplayer Room Manager State
interface RoomState {
  roomId: string;
  gameId: string;
  gameTitle: string;
  questionIndex: number;
  timer: number;
  isActive: boolean;
  players: Array<{
    id: string;
    username: string;
    score: number;
    lastCommand: string;
  }>;
  activeBuzzerHolder: string | null;
  buzzerLockTime: number;
}

const rooms = new Map<string, RoomState>();

io.on('connection', (socket) => {
  logger.info(`Websocket client connected: ${socket.id}`);

  // Join personal voice control room
  socket.on('join_personal_room', ({ username }) => {
    const personalRoom = `room_${username}`;
    socket.join(personalRoom);
    logger.info(`User ${username} joined personal socket room: ${personalRoom}`);
    socket.emit('response_status', { success: true, message: `Successfully connected to control room: ${personalRoom}` });
  });

  // Receive voice action from Python speech client
  socket.on('personal_voice_command', ({ username, phrase }) => {
    const personalRoom = `room_${username}`;
    logger.info(`Voice command from Python for ${username}: "${phrase}"`);
    
    // Broadcast python voice command event back to browser client in room
    io.to(personalRoom).emit('python_voice_command', { phrase });
    
    // Also broadcast to any active multiplayer room the user is participating in
    rooms.forEach((room, roomId) => {
      const player = room.players.find(p => p.username === username);
      if (player && room.isActive) {
        player.lastCommand = phrase;
        rooms.set(roomId, room);
        io.to(roomId).emit('peer_voice_action', { username, phrase });
        io.to(roomId).emit('python_voice_command', { phrase });
      }
    });
  });

  // Create or Join multiplayer learning lobby
  socket.on('join_room', ({ roomId, username, gameId, gameTitle }) => {
    socket.join(roomId);
    
    let room = rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        gameId: gameId || '',
        gameTitle: gameTitle || 'Vocab Showdown',
        questionIndex: 0,
        timer: 60,
        isActive: false,
        players: [],
        activeBuzzerHolder: null,
        buzzerLockTime: 0
      };
      rooms.set(roomId, room);
    }

    // Add player if doesn't exist
    if (!room.players.find(p => p.username === username)) {
      room.players.push({
        id: socket.id,
        username,
        score: 0,
        lastCommand: ''
      });
    }

    logger.info(`Player ${username} joined Room: ${roomId}`);
    io.to(roomId).emit('room_update', room);
  });

  // Start the Multiplayer Battle
  socket.on('start_game', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.isActive = true;
      room.timer = 60;
      room.activeBuzzerHolder = null;
      room.buzzerLockTime = 0;
      rooms.set(roomId, room);
      io.to(roomId).emit('game_started', room);

      // Countdown loop
      const intervalId = setInterval(() => {
        const currentRoom = rooms.get(roomId);
        if (!currentRoom || !currentRoom.isActive) {
          clearInterval(intervalId);
          return;
        }

        if (currentRoom.timer > 0) {
          currentRoom.timer -= 1;
          rooms.set(roomId, currentRoom);
          io.to(roomId).emit('timer_update', currentRoom.timer);
        } else {
          // Terminate on outer limit
          currentRoom.isActive = false;
          rooms.set(roomId, currentRoom);
          io.to(roomId).emit('game_over', currentRoom);
          clearInterval(intervalId);
        }
      }, 1000);
    }
  });

  // Hit Buzzer Request
  socket.on('hit_buzzer', ({ roomId, username }) => {
    const room = rooms.get(roomId);
    if (room && room.isActive && !room.activeBuzzerHolder) {
      room.activeBuzzerHolder = username;
      room.buzzerLockTime = 10; // 10 seconds response window
      rooms.set(roomId, room);
      
      logger.info(`Buzzer locked by ${username} in room: ${roomId}`);
      io.to(roomId).emit('buzzer_locked', { username, buzzerTimer: 10 });
      io.to(roomId).emit('room_update', room);
    }
  });

  // Release Buzzer Request
  socket.on('release_buzzer', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room && room.activeBuzzerHolder) {
      logger.info(`Buzzer released in room: ${roomId}`);
      room.activeBuzzerHolder = null;
      room.buzzerLockTime = 0;
      rooms.set(roomId, room);
      io.to(roomId).emit('buzzer_released');
      io.to(roomId).emit('room_update', room);
    }
  });

  // Echo voice commands in real-time to other users (shows active logs)
  socket.on('voice_action', ({ roomId, username, phrase }) => {
    const room = rooms.get(roomId);
    if (room) {
      const player = room.players.find(p => p.username === username);
      if (player) {
         player.lastCommand = phrase;
         rooms.set(roomId, room);
         socket.to(roomId).emit('peer_voice_action', { username, phrase });
      }
    }
  });

  // Submit dynamic quiz score increments
  socket.on('submit_score', ({ roomId, username, scoreDelta }) => {
    const room = rooms.get(roomId);
    if (room) {
      const player = room.players.find(p => p.username === username);
      if (player) {
        player.score += scoreDelta;
        
        // Auto-release buzzer if responder scored
        if (room.activeBuzzerHolder === username) {
          room.activeBuzzerHolder = null;
          room.buzzerLockTime = 0;
          io.to(roomId).emit('buzzer_released');
        }

        rooms.set(roomId, room);
        io.to(roomId).emit('room_update', room);
      }
    }
  });

  // Leave room or disconnect
  socket.on('leave_room', ({ roomId, username }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.players = room.players.filter(p => p.username !== username);
      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        // Clear buzzer lock if the locker leaves
        if (room.activeBuzzerHolder === username) {
          room.activeBuzzerHolder = null;
          room.buzzerLockTime = 0;
          io.to(roomId).emit('buzzer_released');
        }
        rooms.set(roomId, room);
        io.to(roomId).emit('room_update', room);
      }
    }
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    logger.info(`Websocket client disconnected: ${socket.id}`);
    // Clear dead socket associations
    rooms.forEach((room, roomId) => {
      const remainingPlayers = room.players.filter(p => p.id !== socket.id);
      if (remainingPlayers.length === 0) {
        rooms.delete(roomId);
      } else {
        const leavingPlayer = room.players.find(p => p.id === socket.id);
        if (leavingPlayer && room.activeBuzzerHolder === leavingPlayer.username) {
          room.activeBuzzerHolder = null;
          room.buzzerLockTime = 0;
          io.to(roomId).emit('buzzer_released');
        }
        room.players = remainingPlayers;
        rooms.set(roomId, room);
        io.to(roomId).emit('room_update', room);
      }
    });
  });
});

// Start Express Server listeners
server.listen(PORT, () => {
  logger.info(`Voice Ecosystem platform running locally on http://localhost:${PORT}`);
});
