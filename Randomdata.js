// randomDataGenerator.js

const { faker } = require('@faker-js/faker');
require('dotenv').config();
const { MongoClient } = require('mongodb');

// Configuration
const url = process.env.DB_URL || 'mongodb://localhost:27017'; // Use environment variable for MongoDB URL
const dbName = 'masheen_rental';
const collectionName = 'admins';

// Create a new MongoClient
const client = new MongoClient(url, { useUnifiedTopology: true });

async function RandomData() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    // console.log('Connected to database');
    
    // Get the database and collection
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Generate random data
    const data = [];
    for (let i = 0; i < 1000; i++) {
      data.push({
        serial:i,
        mobile: faker.phone.number(), // Updated API
        otp: faker.number.int({ min: 1000, max: 9999 }), // Updated API
        isMobileVerified: faker.internet.password(),
        email: faker.internet.email(),
        isEmailVerified: faker.internet.password(),
        BankDetails: {
          bankName: faker.company.name(), // Updated API
          ifscCode: faker.finance.accountNumber(), // Example usage
          holderName: faker.name.fullName(), // Updated API
          accountNumber: faker.finance.accountNumber(),
          bankBranch: faker.company.name(),
        },
        CompanyDetails: {
          companyName: faker.company.name(), // Updated API
          companyPrefix: faker.string.alphanumeric(3).toUpperCase(), // Updated API
          email: faker.internet.email(),
          otp: faker.number.int({ min: 1000, max: 9999 }), // Updated API
          gstNumber: faker.string.alphanumeric(15), // Updated API
          panNumber: faker.string.alphanumeric(10), // Updated API
          incorporationDate: faker.date.past().toISOString().split('T')[0],
          companyTelephone: faker.phone.number(), // Updated API
          companyAddress: faker.address.streetAddress(),
          district: faker.address.city(),
          state: faker.address.state(),
        },
        PersonalDetails: {
          firstName: faker.name.firstName(),
          middleName: faker.name.middleName(),
          lastName: faker.name.lastName(),
          dateOfBirth: faker.date.past(30).toISOString().split('T')[0],
          gender: faker.person.gender(), // Updated API
          designation: faker.name.jobTitle(),
          password: faker.internet.password(),
          confirmPassword: faker.internet.password(),
          mobile: faker.phone.number(), // Updated API
          otp: faker.number.int({ min: 1000, max: 9999 }), // Updated API
        },
        companyLogo: faker.image.url(), // Updated API
        company_code: i + 1,
        password: faker.internet.password(),
        piLogo: faker.image.url(), // Updated API
        register_date: faker.date.recent().toISOString(),
        sealImage: faker.image.url(), // Updated API
        signImage: faker.image.url(), // Updated API
        status: faker.datatype.boolean(), // Updated API
      });
    }

    // Insert data into MongoDB
    await collection.insertMany(data);
    // console.log('Data inserted successfully');
  } catch (error) {
    console.error('Error inserting data:', error);
  } finally {
    // Ensure the client is closed when the operation is complete
    await client.close();
  }
}

module.exports = { RandomData };
