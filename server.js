const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

// 1. Security Headers (Set before other middleware)
app.use(helmet());

// 2. Trust Proxy (Required if behind Render/Heroku/Vercel for rate limiting)
app.set('trust proxy', 1);

// 3. Data Sanitization against NoSQL injection
app.use(mongoSanitize());

// 4. Data Sanitization against XSS
app.use(xss());

// 5. Prevent Parameter Pollution
app.use(hpp());

// 6. Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased for development/production stability
    message: 'Too many requests from this IP'
});

// Apply general rate limiting to all routes
app.use('/api/', generalLimiter);

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased to prevent blocking legitimate tests
    message: 'Too many login attempts'
});
app.use('/api/admin/login', loginLimiter);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "https://harris-frontend-kkg4.vercel.app",
            "https://harris-pizza.vercel.app",
            "http://localhost:5173",
            "http://192.168.0.130:5173",
            "http://127.0.0.1:5173"
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
});

const PORT = process.env.PORT || 4000;

// Middleware
const allowedOrigins = [
    "https://harris-frontend-kkg4.vercel.app",
    "https://harris-pizza.vercel.app",
    "http://localhost:5173",
    "http://192.168.0.130:5173",
    "http://127.0.0.1:5173"
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            console.log("Rejected Origin:", origin);
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
}));

app.use(express.json({
    limit: '10kb', // Limit body size to prevent DoS
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
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

    socket.on('joinOrder', (orderId) => {
        if (orderId) {
            const room = `order:${orderId}`;
            socket.join(room);
            console.log(`Socket ${socket.id} joined order room: ${room}`);
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

    socket.on('orderPinged', (data) => {
        // Broadcast to all admins or a specific admin room if it existed
        // For now, simple broadcast for pings
        io.emit('adminOrderPinged', data);
    });

    socket.on('orderPingAcknowledged', (data) => {
        if (data && data.orderId) {
            io.to(`order:${data.orderId}`).emit('orderPingAcknowledged', data);
        }
    });

    socket.on('updateRiderLocation', async (data) => {
        const { riderId, location } = data;
        if (riderId && location) {
            try {
                const Rider = require('./models/Rider');
                const updatedRider = await Rider.findByIdAndUpdate(
                    riderId,
                    {
                        location,
                        lastLocationUpdate: new Date()
                    },
                    { new: true }
                );
                if (updatedRider) {
                    io.emit('riderLocationUpdated', {
                        riderId: updatedRider._id,
                        name: updatedRider.name,
                        location: updatedRider.location,
                        status: updatedRider.status
                    });
                }
            } catch (err) {
                console.error("Failed to update rider location:", err);
            }
        }
    });

    socket.on('updateUserLocation', async (data) => {
        const { email, location, isSharing } = data;
        if (email && location) {
            try {
                const User = require('./models/User');
                await User.findOneAndUpdate(
                    { email },
                    {
                        location,
                        isLocationSharing: isSharing,
                        lastSeen: new Date()
                    }
                );

                if (isSharing) {
                    io.emit('userLocationUpdated', {
                        email,
                        location,
                        isSharing
                    });
                }
            } catch (err) {
                console.error("Failed to update user location:", err);
            }
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
app.use('/api/users', require('./routes/userRoutes'));


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
