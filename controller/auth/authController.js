//Prebuild Dependencies
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

//Configuration
require('dotenv').config();

//Imports
const createUserCollection = require('../../modal/User');
const createRoleCollection = require('../../modal/Roles');
const createMenuCollection = require('../../modal/Menu');
const client = require('../../db/config/dbConfig')

//Constants
const secretKey = 'masheen@123';
const masheenDB = client.db('machine_rental');
const app = 'https://fixhr.app';



//Multipart Data Source
const storage = (folder) => multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname.slice(0, -14), '..', 'assets')); // Adjusted destination
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique file name generation
    }
});

const compressAndStore = (req, res, next) => {
    const files = req.files;
    const compressedFiles = [];

    Promise.all(Object.keys(files).map(async (key) => {
        const file = files[key][0];
        const newPath = path.join(file.destination, 'compressed-' + file.filename);
        await sharp(file.path)
            .resize(800, 800, { // Resize the image
                fit: sharp.fit.inside,
                withoutEnlargement: true
            })
            .toFormat('jpeg')
            .jpeg({ quality: 80 }) // Compress the image
            .toFile(newPath); // Save the compressed image

        // Remove the original file
        fs.unlinkSync(file.path);

        // Add the new file info to the compressedFiles array
        compressedFiles.push({
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            destination: file.destination,
            filename: 'compressed-' + file.filename,
            path: newPath,
            size: fs.statSync(newPath).size
        });
    }))
        .then(() => {
            req.files = compressedFiles; // Replace the files in the request object with the compressed files
            next(); // Proceed to the next middleware
        })
        .catch(err => {
            next(err); // Handle any errors that occur during processing
        });
};


// Create the upload middleware using the storage engine
const upload = multer({ storage: storage() }).fields([
    { name: 'sealImage', maxCount: 1 },
    { name: 'signImage', maxCount: 1 },
    { name: 'piLogo', maxCount: 1 },
    { name: 'companyLogo', maxCount: 1 }
]);


const fetchMenus = async (role) => {
    const menuCollection = masheenDB.collection('menus');
    const menus = await menuCollection.find({}).toArray();
    return menus;
}

const superAdminLogin = async (req, res) => {
    const { username, password } = req.body;
    // // console.log(req.body);

    try {
        const userCollection = masheenDB.collection('super_admin');

        // Find the super admin by username
        const user = await userCollection.findOne({ email: username });

        // Check if the user exists
        if (!user) {
            return res.status(401).json({ error: 'Invalid username' });
        }

        // Check if the password is correct
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Generate JWT
        const name = user.firstName;
        const token = jwt.sign({ username: user.email, companyCode: "machine_rental", role: user.role }, secretKey, { expiresIn: '1W' });
        // const menus = fetchMenus(user.role);

        res.status(200).json({ token, role: user.role, name, message: 'Login successful' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).send('Internal server error');
    }
};


const userLoginWithoutCmpanyCode = async (req, res) => {
    // // console.log(req.body)
    const { userName, password } = req.body;
    // console.log(userName, password);
    const companyCode = userName.slice(0, 9);
    const userid = userName.split('_')[1];
    // console.log(companyCode, " ", userid)

    // Validate the company code
    if (!CompanyCodeExist(companyCode)) {
        return res.status(400).json({ error: 'Invalid company code' });
    }
    if (await IsCompanyActive(companyCode) === "inactive") {
        // console.log("----------------------")
        return res.status(401).json({ error: 'Company Inactive' });
    }
    // // Function to determine if a string is an email address
    // const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userName);

    try {
        const companydb = client.db(companyCode.toUpperCase());
        const userCollection = companydb.collection("users");

        // Find user based on whether userName is an email or mobile number
        let user = await userCollection.findOne({ "id": Number(userid) });
        // console.log(user, "*******");
        if (user.status === false) {
            return res.status(401).json({ error: 'User Inactive' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid username' });
        }

        // Compare provided password with stored hashed password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Generate JWT token
        const name = user.firstName
        // console.log(name, "-------------------------")
        const token = jwt.sign({ username: user.email, companyCode, role: user.role }, secretKey, { expiresIn: '1W' });
        res.status(200).json({ token, name, role: user.role, message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const userLogin = async (req, res) => {
    const { companyCode, userName, password } = req.body;

    // Validate the company code
    if (!CompanyCodeExist(companyCode)) {
        return res.status(400).json({ error: 'Invalid company code' });
    }

    if (await IsCompanyActive(companyCode) === "inactive") {
        return res.status(401).json({ error: 'Company Inactive' });
    }
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userName);

    try {
        const companydb = client.db(companyCode.toUpperCase());
        const userCollection = companydb.collection("users");

        // Find user based on whether userName is an email or mobile number
        let user = await userCollection.findOne(isEmail ? { "email": userName } : { "mobile": userName });

        if (!user) {
            return res.status(401).json({ error: 'Invalid username' });
        }
        if (user.status == false) {
            return res.status(401).json({ error: 'User Inactive' });
        }
        // // console.log(user, "*******");


        // Compare provided password with stored hashed password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid password' });
        }


        // Generate JWT token
        const token = jwt.sign({ username: user.email, companyCode, role: user.role }, secretKey, { expiresIn: '1W' });
        const name = user.firstName
        // const menus = fetchMenus("SUPERADMIN");
        res.status(200).json({ token, role: user.role, name, message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const IsCompanyActive = async (company_code) => {
    try {
        // Extract the prefix and code from the company_code
        const starters = company_code.slice(0, 2);
        if (starters.toUpperCase() !== "FR") {
            return false; // Return false if the prefix is not "FR"
        }

        const extractedPrefix = company_code.slice(2, 5).toUpperCase();
        const extractedCode = Number(company_code.slice(5));

        // Ensure extractedCode is a valid number
        if (isNaN(extractedCode)) {
            return false;
        }

        // Query the admins collection
        const collection = masheenDB.collection("admins");
        const company = await collection.findOne({
            "company_code": extractedCode,
            'CompanyDetails.companyPrefix': extractedPrefix
        });
        // // console.log(company.status,"-********************************")
        // Check if the company was found and return the status
        return ((company && company.status) ? "active" : "inactive");
    } catch (error) {
        console.error('Error checking if company is active:', error);
        return false; // Return false in case of an error
    }
};


const insertUser = async (newAdminDbName, mainData) => {
    try {
        //Extracting data
        const { firstName, middleName, lastName, password, mobile } = mainData.PersonalDetails
        const { panNumber, email } = mainData.CompanyDetails
        const hashedPassword = await bcrypt.hash(password, 10);
        //Defining new document
        const newUser = {
            firstName,
            middleName,
            lastName,
            email,
            panNumber,
            password: hashedPassword,
            role: "ADMIN",
            mobile,
            status: true,
            createdAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A'),
            updatedAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A')
        }

        // console.log(newUser, "************----------------")

        //connecting with new db
        const masheenDB = client.db(newAdminDbName);

        //using collection 
        const userCollection = masheenDB.collection('users');

        //saving user
        userCollection.insertOne(newUser);

    } catch (error) {
        // console.log(error)
    }

}

const createAdmin = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: 'Error uploading files', error: err });
        }
        await compressAndStore(req, res, async (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error processing files', error: err });
            }
            let mainData = req.body.mainData ? JSON.parse(req.body.mainData) : {};

            // Extract files from 'req.files'
            const files = req.files;
            let fileNames = {};
            if (files && files.length > 0) {
                files.forEach((file) => {
                    const fieldname = file?.fieldname;
                    if (fieldname) {
                        fileNames = {
                            ...fileNames,
                            [fieldname]: file.filename,
                        };
                    }
                });
            }
            // console.log(fileNames)

            try {
                // Making connection with specified db
                const adminsCollection = client.db('machine_rental').collection('admins');

                const maxCompany = await adminsCollection.findOne({}, {
                    sort: {
                        company_code: -1
                    }
                });
                let nextCompanyCode = maxCompany?.company_code + 1;
                nextCompanyCode = isNaN(nextCompanyCode) ? 1 : nextCompanyCode;
                let prefix = mainData?.CompanyDetails?.companyPrefix;
                if (prefix) prefix = prefix.toString().toUpperCase();

                // Making JSON object which is to be saved
                const newAdminData = {
                    ...mainData,
                    company_code: nextCompanyCode,
                    register_date: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A'),
                    status: true,
                    otp: 0,
                    password: null,
                    CompanyDetails: {
                        ...mainData.CompanyDetails, companyPrefix: prefix
                    }
                };
                // Saving Admin in machine_rental database
                const mobile = mainData.PersonalDetails.mobile;
                const email = mainData.CompanyDetails.email;
                const fetchedData = await adminsCollection.findOne({ email, mobile });
                if (!fetchedData) return res.status(404).json({ message: "Email Or Mobile number invalid" });
                if (!await bcrypt.compare("true", fetchedData.isMobileVerified)) return res.status(400).json({ message: "Mobile number is not verified" });
                if (!await bcrypt.compare("true", fetchedData.isEmailVerified)) return res.status(400).json({ message: "Email is not verified" });
                const savedData = await adminsCollection.updateOne(
                    { email },
                    {
                        $set: {
                            ...newAdminData,
                            ...fileNames
                        }
                    }
                );

                // Defining new database for each admin
                const newAdminDbName = "FR" + mainData.CompanyDetails.companyPrefix.toUpperCase() + nextCompanyCode.toString().padStart(4, '0');
                const newAdminDb = client.db(newAdminDbName);

                await createUserCollection(newAdminDb);

                // Generate random password
                const generatePassword = (length = 12) => {
                    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
                    let password = '';
                    for (let i = 0; i < length; i++) {
                        const randomIndex = Math.floor(Math.random() * characters.length);
                        password += characters[randomIndex];
                    }
                    return password;
                };

                // Check if password exists in mainData
                let passwordExist = mainData.password;
                let password;
                // If password does not exist, generate a new one
                if (!passwordExist) {
                    password = generatePassword();
                    mainData.PersonalDetails.password = password;
                }






                // console.log(mainData, '--------------------------');
                await insertUser(newAdminDbName, mainData);
                const mailOptions = {
                    from: process.env.SMTP_USER,
                    to: email,
                    subject: 'Registration Information',
                    text: `
                        
                        Dear,
                        We are pleased to inform you that your registration has been successfully completed in Fix Rental. Below are your login details:
                        
                        Username: ${email}
                        Company Code: ${newAdminDbName}
                        ${!passwordExist && 'Password :' + password}
                            
                        Please keep this information secure as it will be required for logging into your account.
                        If you have any questions or need further assistance, visit https://fixingdots.com/contact .
                        Thank you for choosing our services.
                        Best regards,
                        Fix Rental
                        

                                `,
                };
                await transporter.sendMail(mailOptions);

                const message = `Your username is ${email} and company code is ${newAdminDbName}. Keep this information secure for login. Thanks, Fix Rental`;

                const phone = mobile;

                const url = `https://mobicomm.dove-sms.com/submitsms.jsp?user=KesarE&key=8360975400XX&senderid=NSLSMS&mobile=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}&accusage=6`;
                const response = await fetch(url);
                // await createRoleCollection(newAdminDb);
                
                
                return res.status(201).json({ message: 'Admin Created Successfully', companyCode: newAdminDbName });
            } catch (error) {
                console.error(error);
                return res.status(500).json({ message: 'Error creating admin' });
            }
        })
    })
};

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

//Route Controller
const sendRegistrationEmailOtp = async (req, res) => {
    const { email, mobile } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }

    const otp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Otp for Email Verification in Fix Rental',
        text: `Your OTP is ${otp}`,
    };

    try {
        // Check if the user exists with the provided email or mobile number
        const existingUser = await masheenDB.collection("admins").findOne({ email });

        if (existingUser) {
            if (existingUser.isEmailVerified && await bcrypt.compare("true", existingUser.isEmailVerified)) {
                return res.status(400).json({ message: 'Email is already verified and cannot be used.' });
            }
            // Send OTP to the existing user
            await transporter.sendMail(mailOptions);
            await masheenDB.collection("admins").updateOne(
                { email, mobile },
                { $set: { otp: await bcrypt.hash(otp.toString(), 10), isEmailVerified: await bcrypt.hash("false", 10) } },
                { upsert: true }
            );
            return res.json({ message: 'OTP sent successfully' });
        }

        // Send OTP to the new user
        await transporter.sendMail(mailOptions);
        const isEmail = await bcrypt.hash("false", 10);
        await masheenDB.collection("admins").updateOne({ mobile }, { $set: { email, otp: await bcrypt.hash(otp.toString(), 10), isEmailVerified: isEmail } });
        return res.json({ message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Error sending OTP' });
    }
};

//Route Controller
const verifyRegistrationEmailOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        const foundOtp = await masheenDB.collection("admins").findOne({ email });
        if (!foundOtp) {
            return res.status(400).json({ message: 'Invalid Email' });
        }

        if (await bcrypt.compare(otp, foundOtp.otp.toString()) == false) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        const hashedStatus = await bcrypt.hash("true", 10);
        const updateQuery = {
            $set: {
                isEmailVerified: hashedStatus,
                otp: 0,
            }
        };

        await masheenDB.collection("admins").updateOne({ email }, updateQuery);

        return res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error verifying OTP' });
    }
}



const sendRegistrationMobileOtp = async (req, res) => {
    const mobile = req.body.mobile;
    const otp = Math.floor(1000 + Math.random() * 9000);
    const encodedOTP = encodeURIComponent(otp);

    const message = `Your One-Time Password (OTP) is ${encodedOTP}. Please enter this code to proceed. Thanks ${app} NSL LIFE`;
    const phone = mobile;

    const url = `https://mobicomm.dove-sms.com/submitsms.jsp?user=KesarE&key=8360975400XX&senderid=NSLSMS&mobile=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}&accusage=6`;

    try {
        const existingUser = await masheenDB.collection("admins").findOne({ mobile });

        if (existingUser) {
            // console.log(existingUser)
            if (existingUser.isMobileVerified && await bcrypt.compare("true", existingUser.isMobileVerified)) {
                // console.log("object")
                return res.status(400).json('Mobile number is already verified and cannot be used.');
            }
            const response = await fetch(url);
            if (response.ok) {
                await masheenDB.collection("admins").updateOne(
                    { mobile: mobile },
                    { $set: { otp: await bcrypt.hash(otp.toString(), 10), isMobileVerified: await bcrypt.hash("false", 10) } },
                    { upsert: true }
                );
                return res.json("OTP sent successfully");
            }
        }
        const response = await fetch(url);
        const ismobile = await bcrypt.hash("false", 10)
        const data = await masheenDB.collection("admins").insertOne({ mobile, otp: await bcrypt.hash(otp.toString(), 10), isMobileVerified: ismobile });
        return res.json("OTP sent successfully");

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json('Error sending OTP');
    }
}


//Route Controller
const verifyRegistrationMobileOtp = async (req, res) => {
    const { mobile, otp } = req.body;
    // console.log(mobile, otp)

    if (!mobile || !otp) {
        return res.status(400).json({ message: 'Mobile Number and OTP are required' });
    }
    const numberedOtp = Number(otp)
    try {
        const foundOtp = await masheenDB.collection("admins").findOne({ mobile });
        // console.log(foundOtp)
        if (!foundOtp) {
            return res.status(400).json({ message: 'Invalid Mobile' });
        }
        if (!await bcrypt.compare(otp, foundOtp.otp.toString())) return res.status(400).json({ message: 'Invalid OTP' });
        const hashedStatus = await bcrypt.hash("true", 10);
        const updateQuery = {
            $set: {
                isMobileVerified: hashedStatus,
                otp: 0,
            }
        };
        const updated = await masheenDB.collection("admins").updateOne({ mobile }, updateQuery)
        return res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error verifying OTP' });
    }
}


const resetPassword = async (req, res) => {
    // res.status(200).json({ message: 'hehe'})    
    const { companyCode, username, newPassword } = req.body;
    // console.log("Login Request:", req.body);

    // Validate company code
    if (!CompanyCodeExist(companyCode)) {
        return res.status(400).json({ error: 'Invalid company code' });
    }

    // Determine if the username is an email or a phone number
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(username);
    const isPhone = /^\d{10}$/.test(username); // Assuming a 10-digit phone number format

    if (!isEmail && !isPhone) {
        return res.status(400).json({ error: 'Invalid user identifier' });
    }

    try {
        const companydb = client.db(companyCode.toUpperCase()); //
        const userCollection = companydb.collection("users");
        // console.log(companyCode)

        // Find user based on whether username is an email or phone number
        let user = await userCollection.findOne(isEmail ? { "email": username } : isPhone ? { "mobile": username } : null);
        // console.log("User Found:", user);

        if (!user) {
            return res.status(401).json({ error: 'Invalid username' });
        }
        // Encrypt the OTP using bcrypt
        const hashedPassword = await bcrypt.hash(newPassword.toString(), 10);
        // Save the hashed OTP in the user's document
        await userCollection.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword } }
        );
        return res.status(200).json({ message: "Password Reset Successful" });

    } catch (error) {
        console.error('Error during OTP sending:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

}




const sendLoginOTP = async (req, res) => {
    const { companyCode, userName } = req.body;
    // console.log("Login Request:", req.body);

    // Validate company code
    if (!CompanyCodeExist(companyCode)) {
        return res.status(400).json({ error: 'Invalid company code' });
    }
    if (await IsCompanyActive(companyCode) === "inactive") {
        // console.log("----------------------")
        return res.status(401).json({ error: 'Company Inactive' });
    }
    // Determine if the userName is an email or a phone number
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(userName);
    const isPhone = /^\d{10}$/.test(userName); // Assuming a 10-digit phone number format

    if (!isEmail && !isPhone) {
        return res.status(400).json({ error: 'Invalid user identifier' });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit OTP

    try {
        const companydb = client.db(companyCode.toUpperCase()); //
        const userCollection = companydb.collection("users");
        // console.log(companyCode)
        // Find user based on whether userName is an email or phone number
        let user = await userCollection.findOne(isEmail ? { "email": userName } : isPhone ? { "mobile": userName } : null);

        if (!user) {
            return res.status(401).json({ error: 'Invalid username' });
        }
        if (user.status === false) {
            return res.status(401).json({ error: 'User Inactive' });
        }
        // console.log("User Found:", user);
        // Encrypt the OTP using bcrypt
        const hashedOTP = await bcrypt.hash(otp.toString(), 10);
        // Save the hashed OTP in the user's document
        await userCollection.updateOne(
            { _id: user._id },
            { $set: { otp: hashedOTP } }
        );
        // Send OTP
        // console.log(userName)
        if (isEmail) {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: userName,
                subject: 'OTP for Login in Fix Rental',
                text: `Your OTP is ${otp}`,
            };
            await transporter.sendMail(mailOptions);
            // console.log("Sending OTP via Email to:", userName);
            return res.status(200).json({ message: "OTP sent via Email" });

        } else if (isPhone) {

            const encodedOTP = encodeURIComponent(otp);

            const message = `Your One-Time Password (OTP) is ${encodedOTP}. Please enter this code to proceed. Thanks ${app} NSL LIFE`;
            const phone = userName;

            const url = `https://mobicomm.dove-sms.com/submitsms.jsp?user=KesarE&key=8360975400XX&senderid=NSLSMS&mobile=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}&accusage=6`;

            const send = await fetch(url)
            // console.log(send)

            // console.log("Sending OTP via SMS to:", userName);
            return res.status(200).json({ message: "OTP sent via Mobile" });
        }

    } catch (error) {
        console.error('Error during OTP sending:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const verifyOTP = async (req, res) => {
    const { companyCode, userName, otp } = req.body;
    // console.log("OTP Verification Request:", req.body);

    // Validate request parameters
    if (!companyCode || !userName || !otp) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // Access the database
        const companydb = client.db(companyCode.toUpperCase()); //
        const userCollection = companydb.collection("users");

        // Find the user based on userName
        const user = await userCollection.findOne(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(userName) ? { "email": userName } : { "mobile": userName }
        );
        if (!user) {
            return res.status(401).json({ error: 'Invalid username' });
        }
        if (user.status === false) {
            return res.status(401).json({ error: 'User Inactive' });
        }


        // Retrieve the stored hashed OTP
        const storedHashedOTP = user.otp;
        if (!storedHashedOTP) {
            // console.log("OTP not found in DB")
            return res.status(404).json({ error: 'OTP not found for the user' });
        }

        // Compare the provided OTP with the stored hashed OTP
        const isMatch = await bcrypt.compare(otp, storedHashedOTP);

        if (!isMatch) {
            // console.log("Invalid OTP")
            return res.status(401).json({ error: 'Invalid OTP' });

        }

        // OTP is valid, proceed with any necessary actions (e.g., generate a session token)
        const token = jwt.sign({ username: user.email, companyCode, role: user.role }, secretKey, { expiresIn: '1W' });
        const menus = fetchMenus(user.role);
        const name = user.firstName
        // console.log(name, "-------------------------")
        res.status(200).json({ token, menus, name, role: user.role, message: 'Login successful' });

        // Optionally, clear OTP after successful verification if no longer needed
        await userCollection.updateOne(
            { _id: user._id },
            { $unset: { otp: "" } }
        );

    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//Route Controller
const verifyMobileOtp = async (req, res) => {
    const { mobile_number, otp } = req.body;

    if (!mobile_number || !otp) {
        return res.status(400).json({ message: 'Mobile Number and OTP are required' });
    }

    try {

        if (!foundOtp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error verifying OTP' });
    }
}

const sendEmailOtp = async (req, res) => {
    // console.log("object")
    const email = req.body.updatedEmail;
    const company_code = req.body.company_code;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const otp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Otp for Email Verification in Fix Rental',
        text: `Your OTP is ${otp}`,
    };

    try {
        // Check if the user exists with the provided email or mobile number
        const existingUser = await masheenDB.collection("admins").findOne({ email });

        if (existingUser) {
            if (existingUser.isEmailVerified && await bcrypt.compare("true", existingUser.isEmailVerified)) {
                return res.status(409).json({ message: 'Email is already verified and cannot be reused.' });
            }
        }
        await transporter.sendMail(mailOptions);
        await masheenDB.collection("admins").updateOne(
            { company_code },
            { $set: { otp: await bcrypt.hash(otp.toString(), 10), updatedEmail: email } },
        );
        const res = await transporter.sendMail(mailOptions);
        // console.log(res, "////////////////////////////////////")
        return res.json({ message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Error sending OTP' });
    }

}

const verifyEmailOtp = async (req, res) => {
    const { otp, email, company_code, prefix } = req.body;
    // console.log(req.body, "---------------")
    try {
        // Find the document by updatedEmail and otp
        const user = await masheenDB.collection('admins').findOne({
            "updatedEmail": email,
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid Email" });
        }
        if (!bcrypt.compare(otp, user.otp)) return res.status(400).json({ message: "Invalid OTP" });
        // Check if the company code matches
        if (user.company_code != company_code) {
            return res.status(400).json({ message: "Company code mismatch" });
        }
        // console.log("object")

        // OTP and email verification passed, now update the user's email
        const updatedUser = await masheenDB.collection('admins').findOneAndUpdate(
            {
                company_code: company_code
            },
            {
                $set: {
                    "email": email, // Update the main email
                    "CompanyDetails.email": email, // Update email in the company details
                    "updatedEmail": "", // Clear the updatedEmail field
                    "otp": "" // Clear the OTP field after successful verification
                }
            },
            {
                returnDocument: 'before', // Returns the document before the update
            }
        );
        const previousEmail = updatedUser.email;
        // console.log(previousEmail, email, "*******")
        const db = "FR" + prefix?.toUpperCase() + String(company_code).padStart(4, '0');
        // console.log(db)
        const updatedUserDB = await client.db(db).collection('users').updateOne(
            {
                email: previousEmail
            },
            {
                $set: {
                    email
                }
            },
        )
        // console.log("132154", updatedUserDB)
        return res.status(200).json({ message: "Email updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

const sendMobileOtp = async (req, res) => {
    const mobile = req.body.mobile;
    const company_code = req.body.company_code;
    const otp = Math.floor(1000 + Math.random() * 9000);
    const encodedOTP = encodeURIComponent(otp);
    if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }

    try {
        // Check if the user already exists with the provided mobile number
        const existingUser = await masheenDB.collection("admins").findOne({ mobile });

        if (existingUser) {
            if (existingUser.isMobileVerified && await bcrypt.compare("true", existingUser.isMobileVerified)) {
                return res.status(409).json({ message: 'Mobile number is already verified and cannot be reused.' });
            }
        }

        // Simulate sending the OTP via SMS (use an actual SMS gateway here)
        // console.log(`Sending OTP ${otp} to mobile number ${mobile}`);
        const message = `Your One-Time Password (OTP) is ${encodedOTP}. Please enter this code to proceed. Thanks ${app} NSL LIFE`;
        const phone = mobile;

        const url = `https://mobicomm.dove-sms.com/submitsms.jsp?user=KesarE&key=8360975400XX&senderid=NSLSMS&mobile=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}&accusage=6`;
        const response = await fetch(url)
        // console.log(response, "*******************************")
        // Save the OTP (hashed) and mobile number in the database
        await masheenDB.collection("admins").updateOne(
            { company_code },
            { $set: { otp: await bcrypt.hash(otp.toString(), 10), updatedMobile: mobile } },
        );

        return res.json({ message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Error sending OTP:', error);
        return res.status(500).json({ message: 'Error sending OTP' });
    }
};

const verifyMobileOtpforUpdate = async (req, res) => {
    const { otp, mobile, company_code, prefix } = req.body;

    try {
        // Find the document by mobile number and OTP
        const user = await masheenDB.collection('admins').findOne({ "updatedMobile": mobile });

        if (!user) {
            return res.status(400).json({ message: "Invalid Mobile Number" });
        }

        // Verify the OTP
        const isOtpValid = await bcrypt.compare(otp, user.otp);
        if (!isOtpValid) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Check if the company code matches
        if (user.company_code !== company_code) {
            return res.status(400).json({ message: "Company code mismatch" });
        }

        // OTP and mobile number verification passed, now update the user's mobile number
        const updatedUser = await masheenDB.collection('admins').findOneAndUpdate(
            { company_code },
            {
                $set: {
                    "mobile": mobile, // Update the main mobile number
                    "PersonalDetails.mobile": mobile, // Update mobile in the company details
                    "updatedMobile": "", // Clear the updatedMobile field
                    "otp": "" // Clear the OTP field after successful verification
                }
            },
            {
                returnDocument: 'before', // Returns the document before the update
            }
        );

        const previousMobile = updatedUser.mobile;
        // console.log(previousMobile, mobile, "*******")
        const db = "FR" + prefix?.toUpperCase() + String(company_code).padStart(4, '0');
        // console.log(db)
        const updatedUserDB = await client.db(db).collection('users').updateOne(
            {
                mobile: previousMobile
            },
            {
                $set: {
                    mobile
                }
            },
        )

        return res.status(200).json({ message: "Mobile number updated successfully" });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ message: "Server error" });
    }
};




//Route Controller
const fetchDBFromCompanyCode = async (req, res) => {
    const company_code = req.query.company_code;
    try {
        const company = await CompanyCodeExist(company_code);
        company ? res.status(200).json(company.CompanyDetails.companyName) : res.status(404).json({ message: 'Company not found' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error Fetching company' });
    }
}

const CompanyCodeExist = async (company_code) => {
    try {
        if (!company_code) return false;
        if (company_code.length !== 9) return false;
        const starters = company_code.slice(0, 2);
        if (starters?.toUpperCase() !== "FR") return false
        const extractedPrefix = company_code?.slice(2, 5)?.toUpperCase();
        const extractedCode = Number(company_code.slice(5));
        const collection = masheenDB.collection("admins")
        const company = await collection.findOne({ "company_code": extractedCode, 'CompanyDetails.companyPrefix': extractedPrefix });
        return (company ? company : false);
    } catch (error) {
        console.error(error);
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const pageValidteController = async (req, res) => {
    // await sleep(3000);
    // // console.log("Decoded ",req.userInfo)
    // // console.log("Body",req.body)
    const role = req.userInfo.role
    let { currentPath } = req.body;
    currentPath = currentPath?.slice(12, 15);
    if (role === "SUPERADMIN" && currentPath === "sup") return res.status(200).json({ isVerified: true });
    else if (role != "SUPERADMIN") {
        // return res.status(200).json({ isVerified: true });
        return roleBasedAuth(req, res, currentPath);
    }
    return res.status(400).json({ isVerified: false });
    // let { currentPath } = req.body;
    // currentPath = currentPath?.slice(11);
    // if (currentPath?.endsWith("/")) currentPath = currentPath?.slice(0, -1)
    // const menuDetails = await masheenDB.collection("menus").findOne({ menuRoutename: currentPath, menuType })
    // if (!menuDetails) {
    //     let submenuDetails = await masheenDB.collection("subMenus").findOne({ subMenuRouteName: currentPath })
    //     if(!submenuDetails) return res.status(400).json({ isVerified: false });
    //     else {
    //         menuDetails = await masheenDB.collection("menus").findOne({ id: submenuDetails.menu_id, menuType:"SUPERADMIN" })
    //         if(!menuDetails) return res.status(400).json({ isVerified:false });
    //         else return res.status(200).json({ isVerified:true })
    //     }
    // } else {
    // }


    // else roleBasedAuth(req, res);

}
const roleBasedAuth = async (req, res) => {
    try {
        const { role, companyCode } = req.userInfo;
        let { currentPath } = req.body;

        // Clean up the currentPath
        // console.log(currentPath)
        currentPath = currentPath?.slice(11)?.replace(/\/$/, '');
        // console.log(currentPath)

        const roleDetails = await masheenDB.collection("roles").findOne({ roleName: new RegExp(role, 'i') });
        if (!roleDetails) return res.status(401).json({ isVerified: false });

        let menuDetails = await masheenDB.collection("menus").findOne({ menuRoutename: currentPath });

        if (!menuDetails) {
            const submenuDetails = await masheenDB.collection("subMenus").findOne({ subMenuRouteName: currentPath });
            if (!submenuDetails) return res.status(400).json({ isVerified: false });

            menuDetails = await masheenDB.collection("menus").findOne({ id: submenuDetails.menu_id });
            if (!menuDetails) return res.status(400).json({ isVerified: false });
        }

        const permissions = await client.db(companyCode).collection('permissions').findOne({
            role_id: roleDetails.id,
            [`permission_menu.${menuDetails.id}.read`]: true
        });

        const data = await fetchPermissionsForEachPage(roleDetails.id, companyCode)

        return res.status(permissions ? 200 : 401).json({ isVerified: !!permissions, permissions: permissions ? data : null });

    } catch (error) {
        console.error("Error in roleBasedAuth:", error);
        return res.status(500).json({ isVerified: false });
    }
};

const fetchPermissionsForEachPage = async (role_id, companyCode) => {
    const permissions = await client.db(companyCode).collection('permissions').findOne({
        role_id,
    });
    const menus = await masheenDB.collection('menus').find({}).toArray();
    const subMenus = await masheenDB.collection('subMenus').find({}).toArray();

    let menuPermissions = [];
    let subMenuPermissions = [];

    const menuIds = Object.keys(permissions.permission_menu)
        .filter(menuId => permissions.permission_menu[menuId].write)
        .map(Number);

    menuPermissions = menus
        .filter(menu => menuIds.includes(menu.id))
        .map(menu => ({
            id: menu.id,
            menuName: menu.menuName,
            routeName: menu.menuRoutename,
            isWrite: permissions?.permission_menu[menu.id]?.write,
        }));




    const subMenuIds = Object.keys(permissions.permission_subMenu)
        .filter(menuId => permissions?.permission_subMenu[menuId]?.write)
        .map(Number);

    subMenuPermissions = subMenus
        .filter(subMenu => subMenuIds.includes(subMenu.id))
        .map(subMenu => ({
            id: subMenu.id,
            menuName: subMenu.subMenuName,
            routeName: subMenu.subMenuRouteName,
            isWrite: permissions.permission_subMenu[subMenu.id]?.write,
        }));


    const data = [...menuPermissions, ...subMenuPermissions]
    // console.log(menuPermissions, "+-+-+-+-+-++-+-+-+-")
    return data;
}


const Logout = async (req, res) => {
    const token = req.token;
    const { username, companyCode, role } = req.userInfo;
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    if (!companyCode || !username) {
        return res.status(400).json({ error: 'Missing required user information' });
    }

    try {
        const db = client.db(companyCode.toUpperCase());
        const collection = db.collection('users');

        const formattedDate = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A');
        const updateDoc = {
            $set: {
                last_login: formattedDate
            }
        };

        // Update the user's last login time
        const result = await collection.findOneAndUpdate(
            { email: username },
            updateDoc,
            { returnDocument: 'after' } // Optionally return the updated document
        );
        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: "Logged out", last_login: result.last_login });

    } catch (error) {
        console.error('Error processing logout:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};


const SadminLogout = async (req, res) => {
    const token=req.token;
    const { username, role } = req.userInfo;
    // // console.log(username, role)
    // Validate presence of required data
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    if (!username) {
        return res.status(400).json({ error: 'Missing required user information' });
    }

    try {
        const db = client.db("machine_rental");
        const collection = db.collection('super_admin');


        // Prepare the update document
        const formattedDate = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A');
        const updateDoc = {
            $set: {
                last_login: formattedDate
            }
        };

        // Update the user's last login time
        const result = await collection.findOneAndUpdate(
            { email: username },
            updateDoc,
            { returnDocument: 'after' } // Optionally return the updated document
        );
        // // console.log("Result : ", result);
        if (!result) {
            // // console.log('user not found');
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: "Logged out", last_login: result.last_login });

    } catch (error) {
        // console.error('Error processing logout:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};



module.exports = {
    createAdmin,
    sendRegistrationEmailOtp,
    verifyMobileOtp,
    verifyRegistrationEmailOtp,
    fetchDBFromCompanyCode,
    insertUser,
    superAdminLogin,
    verifyRegistrationMobileOtp,
    sendRegistrationMobileOtp,
    sendLoginOTP,
    verifyOTP,
    userLogin,
    resetPassword,
    pageValidteController,
    sendEmailOtp,
    verifyEmailOtp,
    sendMobileOtp,
    verifyMobileOtpforUpdate,
    userLoginWithoutCmpanyCode,
    Logout,
    SadminLogout
}