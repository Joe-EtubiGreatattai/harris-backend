const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity in development, tighten this in production
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Make io accessible to routes
app.set('socketio', io);

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Routes
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/payment/callback', (req, res) => {
    // Redirect to local frontend with query parameters. Ensure this matches your ngrok or local url.
    const queryString = new URLSearchParams(req.query).toString();
    res.redirect(`https://harris-backend.onrender.com/payment/callback?${queryString}`);
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
