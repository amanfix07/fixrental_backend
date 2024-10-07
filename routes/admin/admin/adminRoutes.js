const express = require('express');
const { getAdminByCompanyCode,getAllCategories, getAdminById,get_all_categories_for_machines,getMachineById, fetchCustomerDataById, updateAdmin,fetchDashboardDataForAdmin,getMachinesByCategory,changeStatus, getAllCustomer,addMachine,addCategory,getCategoryById, deleteData,addCustomer, getCustomerById, getStatusForSection} = require('../../../controller/admin/AdminController');
const { authenticateJWT } = require('../../../middlewares/jwtVerification');
const {getAllUser} = require('../Users/userRoute');
const userRouter = require('../Users/userRoute');
const { getBookingId, updateBooking } = require('../../../controller/admin/AssetController');
const adminRouter = express.Router();

adminRouter.get('/profile/get', getAdminByCompanyCode)

adminRouter.get('/profile/get-by-id', getAdminById)

adminRouter.put('/profile/update', updateAdmin)

adminRouter.get('/allcustomer',authenticateJWT, getAllCustomer)

adminRouter.get('/get_all_categories',authenticateJWT, getAllCategories)

adminRouter.get('/get_machines_by_category',authenticateJWT, getMachinesByCategory)

adminRouter.get('/fetch_dashboard_data', authenticateJWT,fetchDashboardDataForAdmin)

adminRouter.post('/change_status', authenticateJWT,changeStatus)
// Route to add a machine
adminRouter.post('/add_machine',authenticateJWT, addMachine);

adminRouter.post('/add_category',authenticateJWT, addCategory);

adminRouter.get('/get_category_by_id',authenticateJWT, getCategoryById);

adminRouter.get('/get_machine_by_id',authenticateJWT, getMachineById);

adminRouter.get('/get_all_categories_for_machines',authenticateJWT, get_all_categories_for_machines);

adminRouter.get('/get_status_by_section',authenticateJWT, getStatusForSection);

adminRouter.delete('/field/delete',authenticateJWT, deleteData);

adminRouter.get('/getCustomerById',authenticateJWT, getCustomerById);


adminRouter.post('/addCustomer',authenticateJWT,addCustomer);

adminRouter.use("/users", userRouter)

adminRouter.post('/assets/bookings/update',authenticateJWT,updateBooking);

adminRouter.get('/assets/bookings/get_booking_id',authenticateJWT,getBookingId);
// adminRouter.get('/getUsers', authenticateJWT, getUsers);

module.exports = adminRouter;