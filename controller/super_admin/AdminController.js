const mongoose = require('mongoose');
const client = require('../../db/config/dbConfig')
const machineRentalDB = client.db("machine_rental");
const adminCollection = machineRentalDB.collection("admins");
const moment = require('moment-timezone');
const { ObjectId } = require('mongodb'); // Ensure this is imported if not already
const {getPaginatedData} = require('../global/PageinatedData')

const getAllAdmins = async (req, res) => {
    // console.log(req.query)
    const page = req.query.page;
    const limit = req.query.limit;
    const filterParams = req.query.filterParams; // This will be an array if multiple values are provided
    const filter = req.query.filter; // This will be the value to search for,

    // Log the parameters to the console
    // console.log('Page :', page);
    // console.log('Limit :', limit);
    // console.log('Filter params :', filterParams);
    // console.log('Filter :', filter);
    // console.log(page,"  ",limit)
    const resdata=await getPaginatedData('masheen_rental','admins',page,limit,filterParams,filter)
    // const resdata=await getPaginatedData('machine_rental','admins',page,limit,filterParams,filter)

    resdata ? res.status(200).send(resdata) : res.status(404);
}

const deleteAdmin = async (req, res) => {
    try {
        // console.log(req.body, "Request body for admin deletion");
        const { company_code } = req.body;

        if (!company_code) {
            return res.status(400).json({ message: 'Invalid Company Code' });
        }
        const result = await adminCollection.deleteOne({ company_code: company_code });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Company not found or already deleted' });
        }
        res.status(200).json({ message: 'Company deleted successfully' });

    } catch (error) {
        console.error('Error deleting admin:', error);

        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteAdmins = async (req, res) => {
    // console.log(req.body);
    const { companyCodes } = req.body; // Array of company codes

    try {
        // Ensure companyCodes is an array
        if (!Array.isArray(companyCodes)) {
            return res.status(400).json({ message: 'companyCodes must be an array' });
        }

        // Use the $in operator to match any company_code in the array
        const result = await adminCollection.deleteMany({
            company_code: { $in: companyCodes }
        });

        // Check if any documents were deleted
        if (result.deletedCount > 0) {
            res.status(200).json({ message: `${result.deletedCount} documents deleted` });
        } else {
            res.status(404).json({ message: 'No Comapny found matching the company codes' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while deleting documents' });
    }
}






function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const changeAdminStatus = async (req, res) => {
    // // console.log("first")
    // await sleep(1000);
    try {
        // Validate the incoming request
        const { company_code, status } = req.body;
        // console.log(req.body)
        if (!company_code) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        // console.log(status)
        const updateFields = status? { status: status }: {  status: status,deactivated_at: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A') };
        // Update the status in the database
        const result = await adminCollection.updateOne(
            { company_code: company_code },
            { $set: updateFields }
        );

        // Check if the update was successful
        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Admin not found or status unchanged' });
        }

        // Respond with a success message
        res.status(200).json({ message: 'Status updated successfully' });

    } catch (error) {
        // Log the error for debugging purposes
        console.error('Error updating admin status:', error);

        // Respond with an error message
        res.status(500).json({ message: 'Internal server error' });
    }
};

// const fetchDashboardData = async (req, res) => {
//     try {
//         const totalCompanies = await adminCollection.countDocuments();
//         const freeCompanies = await adminCollection.countDocuments({ isPaid: false, status: true });
//         const paidCompanies = await adminCollection.countDocuments({ isPaid: true, status: true });
//         const inactiveCompanies = await adminCollection.countDocuments({ status: false });
//         res.status(200).send({ totalCompanies, paidCompanies, freeCompanies, inactiveCompanies });
//     } catch (e) {
//         console.error(e);
//         res.status(500);
//     }
// }




module.exports = {getAllAdmins,deleteAdmin,deleteAdmins,changeAdminStatus}