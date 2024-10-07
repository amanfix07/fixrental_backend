const mongoose = require('mongoose');
const client = require('../../db/config/dbConfig')
const machineRentalDB = client.db("machine_rental");
const adminCollection = machineRentalDB.collection("admins");
const { getPaginatedData } = require('../global/PageinatedData')
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const getAllCategories = async (req, res) => {
    // console.log(req.userInfo,"------------");
    const { page, limit, filterParams, filter } = req.query;
    const { companyCode } = req.userInfo;
    const resdata = await getPaginatedData(companyCode.toUpperCase(), 'product_category', page, limit, filterParams, filter)
    resdata ? res.status(200).send(resdata) : res.status(404);
}

const get_all_categories_for_machines = async (req, res) => {
    const { companyCode } = req.userInfo;
    const db = client.db(companyCode);
    //console.log(companyCode);
    const collection = db.collection("product_category");
    const data = await collection.find({}).toArray();
    res.status(200).send(data)
}

const getMachinesByCategory = async (req, res) => {
    const { page, limit, filterParams, filter, catId } = req.query;
    const { companyCode } = req.userInfo;
    const resdata = await getPaginatedData(companyCode.toUpperCase(), 'machines', page, limit, filterParams, filter, "productType", catId)
    return resdata ? res.status(200).send(resdata) : res.status(404);
}


const getAdminByCompanyCode = async (req, res) => {
    try {
        const companyCode = req.userInfo.company_code;
        // console.log(companyCode)
        const extractedCode = Number(companyCode.slice(5));
        const response = await adminCollection.findOne({ company_code: extractedCode })
        // console.log(response)
        if (response)
            res.status(200).json(response);
        else
            res.status(404).json({ message: 'Admin not found' });
    } catch (error) {
        // console.log(error)
        res.status(500).json({ message: 'Something went wrong!!' });
    }
}

const getAdminById = async (req, res) => {
    try {
        const companyCode = Number(req.query.company_code);
        const response = await adminCollection.findOne({ company_code: companyCode })
        if (response)
            res.status(200).json(response);
        else
            res.status(404).json({ message: 'Admin not found' });
    } catch (error) {
        // console.log(error)
        res.status(500).json({ message: 'Something went wrong!!' });
    }
}
const getAllCustomer = async (req, res) => {
    // console.log(req.query)
    const { companyCode } = req.userInfo;
    const { page, limit, filterParams, filter } = req.query;
    const resdata = await getPaginatedData(companyCode.toUpperCase(), 'customer', page, limit, filterParams, filter)
    resdata ? res.status(200).send(resdata) : res.status(404);
}

//add Customer
const addCustomer = async (req, res) => {
    const { companyCode } = req.userInfo;

    try {
        console.log(req.body)
        const { cid, cname, email, city, phone, contactperson, address } = req.body;

        // // Validate required fields
        // if (!cid) {
        //     return res.status(400).json({ message: 'Customer ID required'});
        // }
        // if (!cname) {
        //     return res.status(400).json({ message: 'Customer name is required' });
        // }
        // if (!email) {
        //     return res.status(400).json({ message: 'Email is required' });
        // }
        // if (!city) {
        //     return res.status(400).json({ message: 'City is required' });
        // }
        // if (!contactPerson) {
        //     return res.status(400).json({ message: 'Contact person is required' })
        // }
        // if (!address) {
        //     return res.status(400).json({ message: 'Address is required' });
        // }

        // Connect to the database
        const db = client.db(companyCode.toUpperCase());
        const collection = db.collection('customer');

        // Fetch the latest customer ID (assuming it's numeric and sequential)
        if (!req.body._id) {
            const latestCustomer = await collection.find().sort({ cid: -1 }).limit(1).toArray();
            const newCustomerId = latestCustomer.length > 0 ? latestCustomer[0].cid + 1 : 1; // Start from 1 if no customers exist

            // Prepare the customer object
            const customer = {
                cid: newCustomerId, // Use the new ID
                cname,
                c_email,
                city,
                phone: phone || null, // Optional phone
                contactperson,
                address,
                createdAt: new Date(),
            };

            // Insert the customer data into the collection
            const result = await collection.insertOne(customer);

            console.log('Customer added:', result);
            return res.status(201).json({ message: 'Customer added successfully', customer: result });
        }else{
            const id = req.body.cid;
            delete req.body.cid;
            delete req.body._id;
            const customer = {
                ...req.body,
                createdAt: new Date(),
            };
            const result = await collection.findOneAndUpdate({cid},customer);
            return res.status(201).json({ message: 'Customer updated successfully', customer: result });
        }

    } catch (error) {
        console.error('Error adding customer:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Setup multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/machineImages';
        cb(null, dir); // Specify the directory to save files
    },
    filename: function (req, file, cb) {
        const uniqueFilename = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueFilename); // Use a unique filename
    }
});

// Initialize multer with storage
const upload = multer({ storage: storage });

// Define the addMachine function


const addMachine = async (req, res) => {
    const { companyCode } = req.userInfo;

    // Handle file uploads
    upload.fields([
        { name: 'rtoImage', maxCount: 1 },
        { name: 'insuranceImage', maxCount: 1 },
        { name: 'roadTaxImage', maxCount: 1 },
        { name: 'pollutionImage', maxCount: 1 },
    ])(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: 'Error uploading files', error: err.message });
        }

        const db = client.db(companyCode.toUpperCase());
        const collection = db.collection('machines');

        try {
            if (req.body.prodId) {
                // Update existing machine
                const existingMachine = await collection.findOne({ prodId: Number(req.body.prodId) });
                if (!existingMachine) {
                    return res.status(404).json({ message: 'Machine not found' });
                }

                // Prepare the machine update data, excluding _id
                const updatedMachineData = {
                    ...req.body,
                    catId: Number(req.body.catId),
                    prodId: Number(req.body.prodId),
                    rtoImage: req.files['rtoImage'] && req.files['rtoImage'].length > 0 ? req.files['rtoImage'][0].path : existingMachine.rtoImage,
                    insuranceImage: req.files['insuranceImage'] && req.files['insuranceImage'].length > 0 ? req.files['insuranceImage'][0].path : existingMachine.insuranceImage,
                    roadTaxImage: req.files['roadTaxImage'] && req.files['roadTaxImage'].length > 0 ? req.files['roadTaxImage'][0].path : existingMachine.roadTaxImage,
                    pollutionImage: req.files['pollutionImage'] && req.files['pollutionImage'].length > 0 ? req.files['pollutionImage'][0].path : existingMachine.pollutionImage,
                };

                // Delete old images if new images are provided
                const imagePaths = {
                    rtoImage: existingMachine.rtoImage,
                    insuranceImage: existingMachine.insuranceImage,
                    roadTaxImage: existingMachine.roadTaxImage,
                    pollutionImage: existingMachine.pollutionImage,
                };
                
                Object.keys(imagePaths).forEach((key) => {
                    const currentImagePath = imagePaths[key];
                
                    // Skip if the current image path is null
                    if (!currentImagePath) {
                        console.log(`Skipping deletion for ${key} as the path is null.`);
                        return; // Skip this iteration
                    }
                
                    if (req.files[key] && req.files[key].length > 0) {
                        const imagePath = path.join(__dirname, 'uploads', 'machineImages', currentImagePath);
                        console.log(imagePath);
                
                        // Check if the file exists
                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath); // Delete old image
                        } else {
                            console.log(`File not found: ${imagePath}`); // Log if the file does not exist
                        }
                    }
                });

                // Update the machine in the database, excluding _id
                const result = await collection.findOneAndUpdate(
                    { prodId: Number(req.body.prodId) },
                    { $set: updatedMachineData },
                    { returnDocument: 'after' }
                );
                return res.status(200).json({ message: 'Machine updated successfully', machine: result.value });
            } else {
                // Add new machine
                const latestProdId = await collection.find().sort({ prodId: -1 }).limit(1).toArray();
                const newProdId = (latestProdId[0]?.prodId || 0) + 1; // Increment the latest prodId

                // Prepare the machine data, ensuring prodId is a number
                const newMachineData = {
                    ...req.body,
                    prodId: newProdId, // Set new prodId
                    catId: Number(req.body.catId),
                    rtoImage: req.files['rtoImage'] && req.files['rtoImage'].length > 0 ? req.files['rtoImage'][0].path : null,
                    insuranceImage: req.files['insuranceImage'] && req.files['insuranceImage'].length > 0 ? req.files['insuranceImage'][0].path : null,
                    roadTaxImage: req.files['roadTaxImage'] && req.files['roadTaxImage'].length > 0 ? req.files['roadTaxImage'][0].path : null,
                    pollutionImage: req.files['pollutionImage'] && req.files['pollutionImage'].length > 0 ? req.files['pollutionImage'][0].path : null,
                };

                // Insert the machine data into the collection
                const result = await collection.insertOne(newMachineData);

                return res.status(200).json({ message: 'Machine added successfully', machine: result.ops[0] });
            }
        } catch (error) {
            console.error('Error adding/updating machine:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    });
};


const deleteData = async (req, res) =>{
    const { companyCode } = req.userInfo;
    const collectionName = req.query.collection;
    const filedName = req.query.field;
    const id = req.query.id;
    console.log(collectionName + ' ' + filedName + '' + id);
    try {
        const db = client.db(companyCode.toUpperCase());
        const collection = db.collection(collectionName);
        const result = await collection.findOneAndDelete({[filedName]:Number(id)});
       if(result) return res.status(200).json({ message: `${result.deletedCount} documents deleted` });
       else return res.status(404).json({ message:"Couldn't find data"});
    } catch (error) {
        console.error('Error deleting data:', error);
        return res.status(500).json({ message: 'Server error' })
    }
}
const addCategory = async (req, res) => {
    const { companyCode } = req.userInfo;
    // console.log(req.body)
    try {
        const { catName, catDescr, catId } = req.body;

        // Validate required fields
        if (!catName) {
            return res.status(400).json({ message: 'Category Name is required' });
        }

        // Connect to the database
        const db = client.db(companyCode.toUpperCase());
        const collection = db.collection('product_category');

        if (catId) {
            // Update existing category
            const result = await collection.updateOne(
                { catId: catId }, // Find category by catId
                { $set: { catName, catDescr: catDescr || null, updatedAt: new Date() } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: 'Category not found' });
            }

            // console.log('Category updated:', result);
            return res.status(200).json({ message: 'Category updated successfully' });
        } else {
            // Fetch the latest category ID
            const latestCategory = await collection.find().sort({ catId: -1 }).limit(1).toArray();
            const newCategoryId = latestCategory.length > 0 ? latestCategory[0].catId + 1 : 1; // Start from 1 if no categories exist

            // Prepare the category object
            const category = {
                catId: newCategoryId, // Use the new ID
                catName,
                catDescr: catDescr || null, // Optional description
                createdAt: new Date(),
            };

            // Insert the category data into the collection
            const result = await collection.insertOne(category);

            // console.log('Category added:', result);
            return res.status(200).json({ message: 'Category added successfully', category: result });
        }
    } catch (error) {
        console.error('Error adding category:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getCategoryById = async (req, res) => {
    const { companyCode } = req.userInfo;
    const { catId } = req.query; // Ensure you're getting catId from the query string

    // console.log(catId, companyCode);

    try {
        // Connect to the database
        const db = client.db(companyCode.toUpperCase());
        const collection = db.collection('product_category');

        // Fetch category details by catId
        const category = await collection.findOne({ catId: parseInt(catId) }); // Make sure to match the field name in the DB

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // console.log('Category retrieved:', category);
        return res.status(200).json(category);

    } catch (error) {
        console.error('Error fetching category:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


const getMachineById = async (req, res) => {
    const { companyCode } = req.userInfo;
    const { prodId } = req.query; // Ensure you're getting prodId from the query string

    console.log(prodId, companyCode);

    try {
        // Connect to the database
        const db = client.db(companyCode.toUpperCase());
        const collection = db.collection('machines');

        // Fetch machine details by prodId
        const machine = await collection.findOne({ prodId: Number(prodId) }); // Make sure to match the field name in the DB

        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }

        // Destructure to exclude _id
        const { _id, ...machineData } = machine;

        // Return machine data without _id
        return res.status(200).json(machineData);

    } catch (error) {
        console.error('Error fetching machine:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get all customers
// router.get('/', async (req, res) => {
//     try {
//         const customer = await Customer.find();
//         res.json(customer);
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

// Get a customer by ID
// router.get('/:id', async (req, res) => {
//     try {
//         const customer = await Customer.findOne({ customer_code: req.params.id });
//         if (customer) {
//             res.json(customer);
//         } else {
//             res.status(404).send('Customer not found');
//         }
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });

const updateAdmin = async (req, res) => {
    // // console.log("object")

    try {
        const company_code = Number(req.query.company_code);
        // console.log(req.body, "********************************************************************")
        if (req?.body?.PersonalDetails) {
            const details = req?.body?.PersonalDetails;
            const firstName = details?.firstName;
            const middleName = details?.middleName;
            const lastName = details?.lastName;
            const dateOfBirth = details?.dateOfBirth;
            const gender = details?.gender;
            const designation = details?.designation
            const email = details?.email
            const prefix = details?.companyPrefix;
            const updatedAdmin = await adminCollection.findOneAndUpdate(
                { company_code }, // Filter to match the document
                {
                    $set: {
                        'PersonalDetails.firstName': firstName,
                        'PersonalDetails.lastName': lastName,
                        'PersonalDetails.middleName': middleName,
                        'PersonalDetails.dateOfBirth': dateOfBirth,
                        'PersonalDetails.gender': gender,
                        'PersonalDetails.designation': designation
                    }
                },
                { returnDocument: 'after' }
            );
            // // console.log(updateAdmin,"--------------------------------")
            const db = "FR" + prefix?.toUpperCase() + String(company_code).padStart(4, '0');
            // // console.log(db)
            // // console.log(email)
            const updatedUserDB = await client.db(db).collection('users').updateOne(
                {
                    email
                },
                {
                    $set: {
                        firstName, lastName, middleName, dateOfBirth, gender, designation
                    }
                },
                { returnDocument: 'after' }
            )
            if (updatedAdmin && updatedUserDB)
                return res.status(200).json(updatedAdmin);
            else
                return res.status(404).json({ message: 'Admin not found' });
        }
        const updatedAdmin = await adminCollection.findOneAndUpdate({ company_code: company_code }, { $set: req.body }, { returnDocument: 'after' });
        if (updatedAdmin)
            res.status(200).json(updatedAdmin);
        else
            res.status(404).json({ message: 'Admin not found' });
    } catch (error) {
        // console.log(error)
        res.status(500).json({ message: 'Something went wrong!!' });
    }

}
const fetchDashboardDataForAdmin = async (req, res) => {
    // // console.log(req.query)
    const { companyCode } = req.query;
    try {
        const db = client.db(companyCode.toUpperCase());
        // const collection = db.collection(collectionName);
        const bookings = await db.collection('bookings').countDocuments();
        const customers = await db.collection('customers').countDocuments();
        const productCatalog = await db.collection('product_catalog').countDocuments();
        const productCategory = await db.collection('product_category').countDocuments();
        const users = await db.collection('users').countDocuments();
        const machines = await db.collection('machines').countDocuments();
        res.status(200).send({ bookings, customers, productCategory, productCatalog, users, machines });
    } catch (e) {
        console.error(e);
        res.status(500);
    }
}

const changeStatus = async (req, res) => {
    // console.log(req.body, "************************");
    const { companyCode } = req.userInfo;
    const { status, collectionName } = req.body;
    // console.log(companyCode, status);

    try {
        const db = client.db(companyCode.toUpperCase());
        const Collection = db.collection(collectionName);

        // Fetch the current status before attempting the update
        const currentDoc = await Collection.findOne({ [req.body.uniqueRow]: req.body.id });

        // Check if the current status is different from the new status
        if (currentDoc && currentDoc.status !== status) {
            const result = await Collection.updateOne(
                { prodId: req.body.id },
                { $set: { status: req.body.status } }
            );
            // Send response only if the status was actually changed
            if (result.modifiedCount > 0) {
                res.status(200).json({ message: 'Status updated successfully.' });
            } else {
                res.status(400).json({ message: 'No changes made to the status.' });
            }
        } else {
            res.status(400).json({ message: 'Status is the same as the current status.' });
        }
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    getAdminByCompanyCode,
    fetchDashboardDataForAdmin,
    getAdminById,
    updateAdmin,
    getAllCategories,
    getMachinesByCategory,
    changeStatus,
    getAllCustomer,
    addMachine,
    addCategory,
    getCategoryById,
    get_all_categories_for_machines,
    deleteData,
    getMachineById,
    addCustomer
};
