const socketIo = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  }
  return io;
};

module.exports = { initSocket, getIO };
