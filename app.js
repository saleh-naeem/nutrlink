const http = require('http');
const express = require("express");
const User = require('./model/User')
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const Conversation = require('./model/Conversation');
const Message = require('./model/Message');
const { initSocket, getIO } = require('./socketInstance');
const io = initSocket(server);
const reportRoutes = require('./route/report');

// Export for use in controllers
module.exports = { io: getIO, server };

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const dotenv = require('dotenv');
const cron = require('node-cron');
const Appointment = require('./model/Appointment'); // Required for cron job

dotenv.config();
connectDB();

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// ══════════════════════════════════════════════════════════════
// AUTOMATED CRON TASKS
// ══════════════════════════════════════════════════════════════
// Runs automatically every day at 00:00 (Midnight) server time
cron.schedule('0 0 * * *', async () => {
  try {
    const currentDate = new Date();
    const result = await Appointment.updateMany(
      { date: { $lt: currentDate }, status: { $in: ['available', 'booked'] } },
      { $set: { status: 'canceled' } }
    );
    console.log(`[CRON] Cleaned up ${result.modifiedCount} past appointments.`);
  } catch (err) {
    console.error('[CRON] Error cleaning appointments:', err);
  }
});

// ══════════════════════════════════════════════════════════════
// SOCKET.IO CHAT & ONLINE STATUS
// ══════════════════════════════════════════════════════════════
let onlineUsers = []
io.on("connection", (socket) => {

  // 1. "Check-in": User joins a room named after their unique User ID
  // 1. "Check-in": User joins a room named after their unique User ID
  socket.on("setup", async (userData) => {
    if (!userData || !userData?._id) return;

    socket.join(userData._id);
    onlineUsers.push({ userId: userData._id, socketId: socket.id });
    io.emit("get-online-users", onlineUsers);

    console.log(`User ${userData.username || 'Unknown'} is now online`);
    socket.emit("connected");

    // NEW: Query DB for unread messages and emit to the specific user
    try {
      const conversations = await Conversation.find({ participants: userData._id }).select('_id');
      const unreadCount = await Message.countDocuments({
        conversationId: { $in: conversations.map(c => c._id) },
        sender: { $ne: userData._id },
        seen: false
      });
      socket.emit("initial_unread_count", unreadCount);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  });

  // 2. "Enter Meeting": User joins a specific conversation room
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined conversation room: " + room);
  });

  // 3. "Broadcast": Sending the message to the other person
  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.conversationId;
    if (!chat) return;

    // Send to the chat room for the active window
    socket.in(chat).emit("message received", newMessageReceived);

    // Send to the recipient's personal room using the ID we just added
    if (newMessageReceived.recipientId) {
      socket.in(newMessageReceived.recipientId).emit("update sidebar", newMessageReceived);

      // NEW: Trigger the Navbar badge increment
      socket.in(newMessageReceived.recipientId).emit("new_message_notification");
    }
  });
  socket.on("delete message", (data) => {
    const { messageId, conversationId } = data;
    socket.in(conversationId).emit("message deleted", { messageId });
  });
  socket.on("typing", (room) => {
    socket.in(room).emit("typing", room)
  })

  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing", room)
  })

  socket.on("disconnect", async () => {
    const userToOffline = onlineUsers.find((u) => u.socketId === socket.id);

    if (userToOffline) {
      const logoutTime = new Date();
      try {
        await User.findByIdAndUpdate(userToOffline.userId, { lastSeen: logoutTime });

        // Broadcast to all other connected clients
        io.emit("user-status-changed", {
          userId: userToOffline.userId,
          lastSeen: logoutTime
        });
      } catch (err) {
        console.error('Error updating lastSeen:', err);
      }
    }

    // Cleanup memory
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("get-online-users", onlineUsers);
  });

  // Remove the specific socket that left
  onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
  // Tell everyone the list has changed
  io.emit("get-online-users", onlineUsers);
  console.log("User left the hotel 🚪");
});

// ══════════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════════

// Auth Routes (login, register, google)
app.use('/nutrlink/api/auth', require('./route/auth'));

// Admin Routes (approve, reject, pending)
app.use('/nutrlink/api/admin', require('./route/admin'));
app.use('/nutrlink/api/reports', require('./route/report'));

app.use('/nutrlink/api/customer/profile', require('./route/customer'));

app.use('/nutrlink/api/nutritionist', require('./route/nutritionist'));

app.use('/nutrlink/api/appointments', require('./route/appointment'))

app.use('/nutrlink/api/customer/goal', require('./route/goal'));

app.use('/nutrlink/api/chat', require('./route/chat'))

app.use('/nutrlink/api/plan', require('./route/dietPlan'))
app.use('/nutrlink/api/AI', require('./route/ai'));

app.use('/nutrlink/api/dashboard', require('./route/dashboard'))
app.use('/nutrlink/api/cdashboard', require('./route/cdashboard'));

app.use('/nutrlink/api/reviews', require('./route/review'))
app.use('/nutrlink/api/calculator', require('./route/calculator'))
app.use('/nutrlink/api/progress', require('./route/progress'))

// ══════════════════════════════════════════════════════════════
// OTHER ROUTES
// ══════════════════════════════════════════════════════════════

// The Home Route
app.get('/nutrlink/login', (req, res) => {
  res.send('<a href="/nutrlink/login/google">Authentication with Google</a>');
});

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'NutriPlan API is running',
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configured' : '❌ Not configured'
  });
});

// ══════════════════════════════════════════════════════════════
// SOCKET.IO VIDEO CALL SETUP
// ══════════════════════════════════════════════════════════════
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', async ({ roomId, userId, username }) => {
    try {
      if (!roomId) {
        socket.emit("room-id-missing");
        return;
      }

      // Avoid redundant requires inside socket events, already required at top but keeping isolated context for safety
      const AppointmentModel = require('./model/Appointment');

      const appointment = await AppointmentModel.findById(roomId)
        .populate('nutritionistId', 'username')
        .populate('customerId', 'username');

      if (!appointment) {
        socket.emit("invalid-room", { message: "Appointment not found" });
        return;
      }

      if (appointment.status !== 'booked') {
        socket.emit("invalid-room", {
          message: `This appointment is ${appointment.status}. Only booked appointments can start a video call.`
        });
        return;
      }

      const isNutritionist = appointment.nutritionistId._id.toString() === userId;
      const isCustomer = appointment.customerId && appointment.customerId._id.toString() === userId;

      if (!isNutritionist && !isCustomer) {
        socket.emit("not-authorized", {
          message: "You are not a participant in this appointment"
        });
        return;
      }

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }

      const room = rooms.get(roomId);

      if (room.size >= 2) {
        socket.emit('room-full', { message: "Room is full. Maximum 2 participants allowed." });
        return;
      }

      for (let [_, user] of room.entries()) {
        if (user.userId === userId) {
          socket.emit("already-joined", { message: "You are already in this room" });
          return;
        }
      }

      socket.join(roomId);
      room.set(socket.id, { userId, username, socketId: socket.id });

      const participants = Array.from(room.entries())
        .filter(([id]) => id !== socket.id)
        .map(([id, user]) => ({
          socketId: id,
          username: user.username,
          userId: user.userId
        }));

      socket.emit('room-users', { participants });
      socket.to(roomId).emit('user-joined', { socketId: socket.id, username, userId });

      if (room.size === 2) {
        io.to(roomId).emit("call-ready");
      }

      console.log(`✅ User ${username} joined room ${roomId}`);

    } catch (err) {
      console.error('❌ Error in join-room:', err);
      socket.emit("server-error", { message: "An error occurred" });
    }
  });

  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  socket.on("toggle-mic", ({ roomId, enabled }) => {
    socket.to(roomId).emit("user-mic-changed", { userId: socket.id, enabled });
  });

  socket.on("toggle-camera", ({ roomId, enabled }) => {
    socket.to(roomId).emit("user-camera-changed", { userId: socket.id, enabled });
  });

  socket.on('leave-room', ({ roomId }) => {
    handleLeaveRoom(socket, roomId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const [roomId, room] of rooms.entries()) {
      if (room.has(socket.id)) {
        handleLeaveRoom(socket, roomId);
      }
    }
  });
});

function handleLeaveRoom(socket, roomId) {
  if (!rooms.has(roomId)) return;
  const room = rooms.get(roomId);
  const user = room.get(socket.id);
  if (!user) return;

  room.delete(socket.id);
  socket.leave(roomId);
  socket.to(roomId).emit('user-left', { socketId: socket.id });
  console.log(`👋 User ${user.username} left room ${roomId}`);

  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`🗑️ Room ${roomId} deleted`);
  } else {
    socket.to(roomId).emit("call-ended");
  }
}

// ══════════════════════════════════════════════════════════════
// ERROR HANDLERS (MUST come after all routes)
// ══════════════════════════════════════════════════════════════
app.use(notFound);
app.use(errorHandler);

// ══════════════════════════════════════════════════════════════
// START SERVER
// ══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('🚀 NutriPlan Server Started');
  console.log('═'.repeat(60));
  console.log(`📡 Server:     http://localhost:${PORT}`);
  console.log(`🎥 Socket.IO:  Connected`);
  console.log(`📁 Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || '❌ NOT CONFIGURED'}`);
  console.log(`${'═'.repeat(60)}\n`);
});