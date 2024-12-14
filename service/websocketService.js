let io;

const setWebSocket = (socketIo) => {
  io = socketIo;
};

const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};


module.exports = { setWebSocket, broadcast };
