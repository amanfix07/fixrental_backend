// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const client = require('./db/config/dbConfig');
require('dotenv').config();

const authRoutes = require('./routes/auth/authRoutes');
const supRouter = require('./routes/super_admin/supRoutes');
const menuRouter = require('./routes/menus/MenuRoutes');
const permissionRouter = require('./routes/permisssion/permissionRoute');
const adminRouter = require('./routes/admin/admin/adminRoutes');
const { login_mechanism_router, loadDataIntoMemory } = require('./Login_mechanism/login_mechanism_routes');

const { RandomData } = require('./Randomdata');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
const PORT = process.env.PORT || 3000;

// Use routes
app.use('/auth', authRoutes);
app.use('/api/sup', supRouter);
app.use('/api/menus', menuRouter);
app.use('/api/permission', permissionRouter);
app.use('/api/admin', adminRouter);
app.use('/api/login_mechanism', login_mechanism_router);

// Connect to MongoDB
const connectToDb = async () => {
  await client.connect();
  // console.log('Connected to MongoDB');
};

// Start the server only after MongoDB connection and data loading
connectToDb()
  .then(async () => {
    // Load data into memory
    // await loadDataIntoMemory();
    // console.log('Data loaded into memory successfully.');

    // Optionally, insert random data
    // if (true) {
    //   RandomData();
    // }

    // Start the serve
    app.listen(PORT, () => {
       console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error during server startup:', error);
  });
