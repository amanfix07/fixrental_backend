const { MongoClient } = require('mongodb');
require('dotenv').config();

//Making connection with instanc
const client = new MongoClient(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
 module.exports = client;