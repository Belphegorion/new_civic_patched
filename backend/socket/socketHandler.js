const authService = require('../services/authService');

/**
 * Middleware for authenticating Socket.io connections.
 * It uses the JWT provided by the frontend during the handshake.
 */
const socketAuthMiddleware = (socket, next) => {
    // The token is expected to be in `socket.handshake.auth.token`
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: Token not provided'));
    }

    try {
        // Verify the token's validity
        const decoded = authService.verifyToken(token);
        // Attach the user's payload (id, role) to the socket for use in event handlers
        socket.user = decoded;
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
    }
};

/**
 * Initializes the Socket.io server and its event listeners.
 * @param {import('socket.io').Server} io The Socket.io server instance.
 */
const initializeSocket = (io) => {
    io.use(socketAuthMiddleware);

    io.on('connection', (socket) => {
        console.log(`[Socket.io] User connected: ${socket.user.id} (Role: ${socket.user.role})`);

        socket.join(socket.user.id);
        
        // Join department room for admins
        socket.on('join-department', (departmentId) => {
            if (socket.user.role === 'Admin') {
                socket.join(`dept:${departmentId}`);
                console.log(`Admin ${socket.user.id} joined department: ${departmentId}`);
            }
        });
        
        // Join location-based room
        socket.on('join-location', (coordinates) => {
            const locationRoom = `loc:${Math.floor(coordinates.lat)}_${Math.floor(coordinates.lng)}`;
            socket.join(locationRoom);
            console.log(`User ${socket.user.id} joined location: ${locationRoom}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.io] User disconnected: ${socket.user.id}`);
        });
    });
};

const broadcastToLocation = (io, coordinates, message) => {
    const locationRoom = `loc:${Math.floor(coordinates.lat)}_${Math.floor(coordinates.lng)}`;
    io.to(locationRoom).emit('location-update', message);
};

const broadcastToDepartment = (io, departmentId, message) => {
    io.to(`dept:${departmentId}`).emit('department-update', message);
};

module.exports = { initializeSocket, broadcastToLocation, broadcastToDepartment };