const mongoose = require('mongoose');
const client = require('../../db/config/dbConfig')
const machineRentalDB = client.db("masheen_rental");
const adminCollection = machineRentalDB.collection("admins");
const moment = require('moment-timezone');

const getAllAdmins = async (req, res) => {
    const admins = await adminCollection.find().toArray();
    admins ? res.status(200).send(admins) : res.status(404);
}

const deleteAdmins = async (req, res) => {
    try {
        await adminCollection.deleteOne({ _id: req.params._id })
        res.status(200);
    } catch (error) {
        res.status(404);
    }
}

const changeAdminStatus = async (req, res) => {
    try {
        await adminCollection.updateOne({ _id: req.body._id }, { $set: { isActive: req.body.isActive } });
        res.status(200);
    } catch (error) {
        res.status(404);
    }
}

const fetchDashboardData = async (req, res) => {
    try {
        const totalCompanies = await adminCollection.countDocuments();
        const freeCompanies = await adminCollection.countDocuments({ isPaid: false, status: true });
        const paidCompanies = await adminCollection.countDocuments({ isPaid: true, status: true });
        const inactiveCompanies = await adminCollection.countDocuments({ status: false });
        res.status(200).send({ totalCompanies, paidCompanies, freeCompanies, inactiveCompanies });
    } catch (e) {
        console.error(e);
        res.status(500);
    }
}

const fetchCompanyRegisteredThisMonth = async (req, res) => {
    try {
        const currentDate = moment().tz('Asia/Kolkata');
    
        // Construct the first and last day of the month in 'Asia/Kolkata' timezone
        const firstDayOfMonth = moment.tz([currentDate.year(), currentDate.month(), 1], 'Asia/Kolkata').startOf('day');
        const lastDayOfMonth = moment.tz([currentDate.year(), currentDate.month() + 1, 0], 'Asia/Kolkata').endOf('day');
    
        // console.log("Query dates:", firstDayOfMonth.format('DD-MM-YYYY hh:mm:ss A'), lastDayOfMonth.format('DD-MM-YYYY hh:mm:ss A'));
    
        // Query the collection using the formatted date strings and projecting only specific fields
        const registeredCompaniesThisMonth = await adminCollection.find({
            register_date: {
                $gte: firstDayOfMonth.format('DD-MM-YYYY hh:mm:ss A'), // Greater than or equal to the first day
                $lte: lastDayOfMonth.format('DD-MM-YYYY hh:mm:ss A')   // Less than or equal to the last day
            }
        }, {
            projection: {
                status: 1,                         // Include status field
                register_date: 1,
                company_code:1,        
                companyLogo:1,          // Include register_date field
                'CompanyDetails.companyName': 1,   // Include companyName inside the CompanyDetails object
                _id: 0                             // Exclude _id field
            }
        }).sort({ register_date: -1 }).limit(5).toArray();
    
        // console.log(registeredCompaniesThisMonth);
        res.status(200).send( registeredCompaniesThisMonth );
    
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while fetching companies.' });
    }
};

const fetchCompanyCountChartData = async (req, res) => {
    try {
        const currentDate = moment().tz('Asia/Kolkata'); // Get current date in 'Asia/Kolkata' timezone
        
        // Calculate the start date (12 months ago from today)
        const startDate = currentDate.clone().subtract(12, 'months').startOf('month');
        
        // Perform aggregation in MongoDB
        const result = await adminCollection.aggregate([
            {
                // Match documents where register_date is within the last 12 months
                $match: {
                    status:true,
                    register_date: {
                        $gte: startDate.format('DD-MM-YYYY hh:mm:ss A') // start of 12 months ago
                    }
                }
            },
            {
                // Group by year and month (extract year and month from register_date)
                $group: {
                    _id: {
                        year: { $substr: ["$register_date", 6, 4] }, // Extract year from DD-MM-YYYY format
                        month: { $substr: ["$register_date", 3, 2] }  // Extract month from DD-MM-YYYY format
                    },
                    totalCompanies: { $sum: 1 }, // Count total companies
                    paidCompanies: {
                        $sum: { $cond: [{ $eq: ["$isPaid", true] }, 1, 0] } // Count paid companies
                    }
                }
            },
            {
                // Sort by year and month
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]).toArray();
        
        // console.log(result);
        res.status(200).send({ result });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while fetching companies.' });
    }
};




module.exports = { getAllAdmins, deleteAdmins, changeAdminStatus, fetchDashboardData, fetchCompanyRegisteredThisMonth, fetchCompanyCountChartData }