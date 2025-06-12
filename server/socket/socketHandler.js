const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketHandler {
    constructor(server) {
        this.io = socketIo(server, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.users = new Map(); // Store connected users
        this.rooms = new Map(); // Store room information

        this.setupMiddleware();
        this.setupEventHandlers();
    }

    // Middleware for authentication
    setupMiddleware() {
        this.io.use((socket, next) => {
            try {
                // const token = socket.handshake.auth.token;
                // const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // socket.userId = decoded.id;
                // socket.role = decoded.role;
                // socket.email = decoded.email;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`User ${socket.userId} connected`);

            // Store user info
            this.users.set(socket.userId, {
                socketId: socket.id,
                username: socket.username,
                status: 'online'
            });

            // Handle user joining room
            socket.on('join_room', (roomId) => {
                socket.join(roomId);
                socket.currentRoom = roomId;

                // Update room info
                if (!this.rooms.has(roomId)) {
                    this.rooms.set(roomId, new Set());
                }
                this.rooms.get(roomId).add(socket.userId);

                // Notify others in room
                socket.to(roomId).emit('user_joined', {
                    userId: socket.userId,
                    username: socket.username
                });

                // Send room users list
                const roomUsers = Array.from(this.rooms.get(roomId)).map(userId =>
                    this.users.get(userId)
                ).filter(Boolean);

                socket.emit('room_users', roomUsers);
            });

            // Handle sending message
            socket.on('send_message', (data) => {

                console.log("Data nhận", data.content)
                const messageData = {
                    id: Date.now().toString(),
                    content: data.content,
                    senderId: socket.userId,
                    senderName: socket.username,
                    timestamp: new Date().toISOString(),
                    roomId: data.roomId
                };

                // Broadcast to room including sender
                this.io.to(data.roomId).emit('receive_message', messageData);

                // Here you can save to database
                // await saveMessage(messageData);
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log(`User ${socket.username} disconnected`);

                // Remove from current room
                if (socket.currentRoom && this.rooms.has(socket.currentRoom)) {
                    this.rooms.get(socket.currentRoom).delete(socket.userId);
                    socket.to(socket.currentRoom).emit('user_left', {
                        userId: socket.userId,
                        username: socket.username
                    });
                }

                // Remove user
                this.users.delete(socket.userId);
            });
        });
    }

    // Helper methods
    getUsersInRoom(roomId) {
        if (!this.rooms.has(roomId)) return [];
        return Array.from(this.rooms.get(roomId)).map(userId =>
            this.users.get(userId)
        ).filter(Boolean);
    }

    sendToUser(userId, event, data) {
        const user = this.users.get(userId);
        if (user) {
            this.io.to(user.socketId).emit(event, data);
        }
    }
}

module.exports = SocketHandler;