const mongoose = require('mongoose');
const client = require('../../db/config/dbConfig');
const machineRentalDB = client.db("machine_rental");
const userCollection = machineRentalDB.collection("users");
const { getPaginatedData } = require('../global/PageinatedData');


const getAllUsers = async (req, res) => {
    const { companyCode } = req.userInfo; // Extract company code from user info
    const { page, limit, filterParams, filter } = req.query; // Extract pagination and filter parameters from the request
    
    console.log("Company Code:", companyCode);
    console.log("Page:", page, "Limit:", limit, "Filter Params:", filterParams, "Filter:", filter);
    
    try {
        const resdata = await getPaginatedData(companyCode.toUpperCase(), 'users', page, limit, filterParams, filter);
        
        console.log("Fetched Data:", resdata);
        
        if (resdata && resdata.data.length > 0) {
            return res.status(200).send(resdata); // Send back the paginated user data
        } else {
            return res.status(404).send({ message: 'No users found.' }); // Send a not found response if no data
        }
    } catch (error) {
        console.error('Error fetching users:', error); // Log the error for debugging
        return res.status(500).send({ message: 'Server error while fetching users.' }); // Send back a server error response
    }
};


const addUser = async (req, res) => {
    const { companyCode } = req.userInfo;
    const db = client.db(companyCode.toUpperCase());
    const userCollection = db.collection('users');

    try {
        const { id, uName, firstName, middleName, lastName, email, gender, role, uDepartment, permission, details } = req.body;

        if (id) {
            // Update existing user
            const existingUser = await userCollection.findOne({ id: Number(id) });
            if (!existingUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            const updatedUserData = {
                uName,
                firstName,
                middleName,
                lastName,
                email,
                gender,
                role,
                uDepartment,
                permission,
                details
            };

            const result = await userCollection.findOneAndUpdate(
                { id: Number(id) },  // Fixed to use the correct field for finding the user
                { $set: updatedUserData },
                { returnDocument: 'after' }
            );

            return res.status(200).json({ message: 'User updated successfully', user: result.value });
        } else {
            // Check if the user already exists
            const existingUser = await userCollection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists with this email' });
            }

            // Add new user
            const latestUser = await userCollection.find().sort({ id: -1 }).limit(1).toArray();
            const newUserId = (latestUser[0]?.id || 0) + 1; // Increment the latest userId

            const newUserData = {
                ...req.body,
                id: newUserId, // Set new userId
                
            };

            // Insert the user data into the collection
            const result = await userCollection.insertOne(newUserData);

            return res.status(201).json({ message: 'User added successfully', user: result.ops[0] });
        }
    } catch (error) {
        console.error('Error adding/updating user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getUserById = async (req, res) => {
    const { companyCode } = req.userInfo; // Get the company code from user info
    const { id } = req.query; // Ensure you're getting the user ID from the query string

    console.log(id, companyCode); // Log the ID and company code for debugging

    try {
        // Connect to the database
        const db = client.db(companyCode.toUpperCase());
        const collection = db.collection('users');

        // Fetch user details by id
        const user = await collection.findOne({ id: Number(id) }); // Make sure to match the field name in the DB
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Destructure to exclude _id
        const { _id, ...userData } = user;

        // Return user data without _id
        return res.status(200).json(userData);

    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getAllRoles = async (req, res) => {
    try {
        const result = await roleCollection.find({}).toArray();
        // console.log(result)
        if (result) return res.status(200).json(result);
        else return res.status(400).json({ message: "Failed to fetch Roles" });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch Roles" });
    }
}












module.exports = {
    getAllUsers,
    addUser,
    getUserById,
    getAllRoles,
};
