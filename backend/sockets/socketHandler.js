const initializeSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join rooms based on role
    socket.on('joinRoom', ({ room }) => {
      socket.join(room);
      console.log(`📌 Socket ${socket.id} joined room: ${room}`);
    });

    // Customer joins their table room
    socket.on('joinTable', ({ tableNumber }) => {
      socket.join(`table-${tableNumber}`);
      console.log(`🍽️ Customer joined table-${tableNumber}`);
    });

    // Admin/Kitchen joins their room
    socket.on('joinAdmin', () => {
      socket.join('admin-room');
      console.log(`👨‍💼 Admin joined admin-room`);
    });

    socket.on('joinKitchen', () => {
      socket.join('kitchen-room');
      console.log(`👨‍🍳 Kitchen joined kitchen-room`);
    });

    // Waiter acknowledgment
    socket.on('waiterAcknowledged', ({ tableNumber }) => {
      io.to(`table-${tableNumber}`).emit('waiterOnWay', { tableNumber });
    });

    // Order acknowledged by kitchen
    socket.on('orderAcknowledged', ({ orderId, tableNumber }) => {
      io.to(`table-${tableNumber}`).emit('orderAcknowledged', { orderId });
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initializeSockets };
