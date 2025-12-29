const { Server } = require('socket.io');
let io;

function initSocket(server) {
  const origins = (process.env.SOCKET_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: origins,
      credentials: true,
    },
    // Loosen ping timeouts slightly to reduce accidental disconnects on slow networks
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || 20000, 10),
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || 25000, 10),
  });

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    socket.on('joinAdmin', () => {
      socket.join('admin');
      console.log('👨‍💼 Admin joined admin room:', socket.id);
    });

    socket.on('joinCustomer', (userId) => {
      socket.join(`customer_${userId}`);
      console.log(`👤 Customer ${userId} joined room: customer_${userId}`, 'Socket ID:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected:', socket.id);
    });
  });

  return io; // Return the io instance for use in other controllers
}

function emitAdminNotification(notification) {
  if (io) {
    console.log('📢 [ADMIN] Emitting to admin room:', notification._id);
    io.to('admin').emit('adminNotification', notification);
  } else {
    console.error('❌ Socket.IO not initialized (admin notification)');
  }
}

function emitCustomerNotification(customerId, notification) {
  if (io) {
    const customerIdStr = customerId.toString ? customerId.toString() : String(customerId);
    const roomName = `customer_${customerIdStr}`;
    console.log('📢 [CUSTOMER] Emitting to room:', roomName);
    console.log('📢 [CUSTOMER] Notification:', {
      id: notification._id,
      type: notification.type,
      isCustomerNotification: notification.isCustomerNotification,
      title: notification.title
    });
    io.to(roomName).emit('customerNotification', notification);
  } else {
    console.error('❌ Socket.IO not initialized (customer notification)');
  }
}

module.exports = { initSocket, emitAdminNotification, emitCustomerNotification };
