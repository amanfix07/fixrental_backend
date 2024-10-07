const express = require('express');
const { faker } = require('@faker-js/faker');

const login_mechanism_router = express.Router();
const client = require('../db/config/dbConfig');
const masheenDB = client.db('masheen_rental');
const collection = masheenDB.collection('login_mechanism');

let emailNumberMap = {};

// Function to save data to MongoDB
async function saveToDatabase(email, companyCode) {
    try {
        await collection.insertOne({ email, companyCode });
        // console.log(`Data saved to database: { email: ${email}, companyCode: ${companyCode} }`);
    } catch (error) {
        console.error('Error saving data to the database:', error);
        throw error;
    }
}

// Function to add data to in-memory map
function addToInMemoryMap(email, companyCode) {
    emailNumberMap[email] = companyCode;
    // console.log(`Data added to in-memory map: { email: ${email}, companyCode: ${companyCode} }`);
}

// Controller to handle saving email and companyCode
async function handleEmailNumberRequest(req, res) {
    const { email, companyCode } = req.body;

    if (!email || !companyCode) {
        return res.status(400).json({ error: 'Email and companyCode are required' });
    }

    try {
        // Save to MongoDB
        await saveToDatabase(email, companyCode);
        // Update the in-memory map
        addToInMemoryMap(email, companyCode);

        res.json({ message: 'Email and companyCode added successfully', data: { email, companyCode } });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Route to add email and companyCode mapping
login_mechanism_router.post('/add_email_number', handleEmailNumberRequest);

// Route to get companyCode by email from in-memory map
login_mechanism_router.get('/get_companyCode_hash/:email', (req, res) => {
    const email = req.params.email;
    const companyCode = emailNumberMap[email];

    if (companyCode) {
        res.json({ email, companyCode });
    } else {
        res.status(404).json({ error: 'Email not found' });
    }
});

// Route to get company code by email from MongoDB
login_mechanism_router.get('/get_companyCode_db/:email', async (req, res) => {
    const email = req.params.email;

    try {
        const record = await collection.findOne({ email });

        if (record) {
            const companyCode = record.companyCode;
            res.json({ email, companyCode });
        } else {
            res.status(404).json({ error: 'Email not found' });
        }
    } catch (error) {
        console.error('Error fetching company code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Function to load data from MongoDB into the in-memory map on server start
async function loadDataIntoMemory() {
    try {
        const mappings = await collection.find({}).toArray();

        mappings.forEach(mapping => {
            emailNumberMap[mapping.email] = mapping.companyCode;
        });

        // console.log('Data loaded into memory:', emailNumberMap);
    } catch (error) {
        console.error('Error loading data into memory:', error);
    }
}

// Route to populate database with random data
login_mechanism_router.get('/populate', async (req, res) => {
    try {
        const data = [];
        for (let i = 0; i < 500000; i++) {
            const email = faker.internet.email();
            const companyCode = faker.number.int({ min: 1001, max: 100000 });
            data.push({ email, companyCode });

            // Also update the in-memory map during population
            addToInMemoryMap(email, companyCode);
        }

        // Insert data into MongoDB
        await collection.insertMany(data);
        // console.log('Data inserted successfully');
        return res.status(200).json({ message: 'Data inserted successfully' });
    } catch (error) {
        console.error('Error inserting data:', error);
        return res.status(500).json({ message: 'Error inserting data' });
    }
});

module.exports = {
    login_mechanism_router,
    loadDataIntoMemory,
};
