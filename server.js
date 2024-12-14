const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const websocketService = require('./service/websocketService');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

websocketService.setWebSocket(io);

io.on('connection', (socket) => {
  console.log('WebSocket connected');
  socket.on('disconnect', () => console.log('WebSocket disconnected'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
