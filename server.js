const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://harris-frontend-kkg4.vercel.app", // Hosted frontend
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Make io accessible to routes
app.set('socketio', io);

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        updateBestSellers(io); // Initial ranking on startup
    })
    .catch(err => console.log('MongoDB Connection Error:', err));

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Clients join a room based on their email for scoped updates
    socket.on('join', (email) => {
        if (email) {
            const room = `user:${email}`;
            socket.join(room);
            console.log(`User ${email} joined room: ${room}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    // Relay client-side events for cross-tab/cross-device syncing
    socket.on('userProfileUpdated', (data) => {
        // Data contains the full profile including email
        if (data && data.email) {
            const room = `user:${data.email}`;
            socket.to(room).emit('userProfileUpdated', data);
        }
    });

    socket.on('cartUpdated', (data) => {
        // Expecting data to have { email, items }
        if (data && data.email) {
            const room = `user:${data.email}`;
            socket.to(room).emit('cartUpdated', data.items);
        } else if (Array.isArray(data)) {
            // Fallback for old clients if any, though we should update all
            socket.broadcast.emit('cartUpdated', data);
        }
    });

    socket.on('cartCleared', (data) => {
        // Expecting data to have { email }
        if (data && data.email) {
            const room = `user:${data.email}`;
            socket.to(room).emit('cartCleared');
        } else {
            socket.broadcast.emit('cartCleared');
        }
    });
});

// Routes
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const promoRoutes = require('./routes/promoRoutes');
const { updateBestSellers } = require('./services/rankingService');

app.use('/api/products', productRoutes);
app.use('/api/riders', require('./routes/riderRoutes'));
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/promos', promoRoutes);
app.use('/api/payouts', require('./routes/payoutRoutes'));

app.get('/payment/callback', (req, res) => {
    // Redirect to frontend with query parameters
    const queryString = new URLSearchParams(req.query).toString();
    const frontendUrl = process.env.FRONTEND_URL || "https://harris-frontend-kkg4.vercel.app";
    res.redirect(`${frontendUrl}/payment/callback?${queryString}`);
});

app.get('/', (req, res) => {
    res.send('Pizza App API is running');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date(), port: PORT });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
