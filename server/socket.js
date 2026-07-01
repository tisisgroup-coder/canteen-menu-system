let io;

module.exports = {
  init: (httpServer) => {
    io = require('socket.io')(httpServer);
    io.on('connection', (socket) => {
      console.log('A screen connected:', socket.id);
    });
    return io;
  },
  getIO: () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
  }
};