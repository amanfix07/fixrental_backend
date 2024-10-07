const mongoose = require('mongoose');
const client = require('../../db/config/dbConfig')
const machineRentalDB = client.db("machine_rental");
const adminCollection = machineRentalDB.collection("admins");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads', 'bookings');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const uniqueFilename = `${file.fieldname}_${timestamp}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

// Initialize upload middleware
const upload = multer({ storage });

const getBookingId = async (req, res) => {
    console.log(req.query.assetId)
    try {
        const { companyCode } = req.userInfo;
        const { assetId } = req.query;
        const db = client.db(companyCode);
        const collection = db.collection("bookings");
        const booking = await collection.findOne({ assetId: assetId, status: 'NOTCREATED' });
        if (booking) return res.status(200).json({ bookingId: booking.bookingId });

        const maxBooking = await collection.findOne({}, { sort: { bookingId: -1 } });
        let lastIndex = maxBooking ? Number(maxBooking.bookingId) + 1 : 1
        lastIndex = isNaN(lastIndex) ? 1 : lastIndex;
        await collection.insertOne({ bookingId: lastIndex, assetId: assetId, status: 'NOTCREATED' });
        return res.status(200).json({ bookingId: lastIndex });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
const updateBooking = async (req, res) => {
    // Handling file uploads
    upload.fields([
        { name: 'SecurityCheque.chequeImage', maxCount: 1 },
        { name: 'AdvancePayment.chequeImage', maxCount: 1 },
    ])(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        try {
            const { companyCode } = req.userInfo;
            const { bookingId } = req.query;
            const db = client.db(companyCode);
            const collection = db.collection("bookings");


            const bookingInfo = JSON.parse(req.body.bookingInfo || "{}");
            const transportationInfo = JSON.parse(req.body.transportationInfo || "{}");
            const machineInfo = JSON.parse(req.body.machineInfo || "{}");
            const paymentInfo = JSON.parse(req.body.paymentInfo || "{}");

            let finalPaymentInfo = {
                paymentType: paymentInfo.paymentType || "",
                SecurityCheque: paymentInfo.SecurityCheque || {},
                AdvancePayment: paymentInfo.AdvancePayment || {}
            };

            if (req.files) {
                if (finalPaymentInfo.paymentType === "SecurityCheque" && req.files['SecurityCheque.chequeImage']) {
                    const chequeImageFile = req.files['SecurityCheque.chequeImage'][0];
                    finalPaymentInfo.SecurityCheque.chequeImage = chequeImageFile.filename;
                }

                if (finalPaymentInfo.paymentType === "AdvancePayment" && req.files['AdvancePayment.chequeImage']) {
                    const chequeImageFile = req.files['AdvancePayment.chequeImage'][0];
                    finalPaymentInfo.AdvancePayment.cheque.chequeImage = chequeImageFile.filename;
                }
            }

            await collection.findOneAndUpdate(
                { bookingId: Number(bookingId) },
                {
                    $set: {
                        bookingInfo,
                        transportationInfo,
                        machineInfo,
                        paymentInfo: finalPaymentInfo,
                        status: 'CREATED',
                    }
                }
            );

            return res.status(200).json({ message: 'Booking updated successfully!' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    });
};




module.exports = {
    getBookingId,
    updateBooking,
}