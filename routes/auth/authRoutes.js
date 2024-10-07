const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { authenticateJWT } = require('../../middlewares/jwtVerification');
const {
    createAdmin,
    sendMobileOtp,
    sendRegistrationEmailOtp,
    verifyMobileOtp,
    verifyRegistrationEmailOtp,
    fetchDBFromCompanyCode,
    superAdminLogin,
    sendRegistrationMobileOtp,
    verifyRegistrationMobileOtp,
    userLogin,
    userLoginWithoutCmpanyCode,
    sendLoginOTP,
    verifyOTP,
    pageValidteController,
    resetPassword,
    sendEmailOtp,
    verifyEmailOtp,
    verifyMobileOtpforUpdate,
    Logout,
    SadminLogout
} = require('../../controller/auth/authController');

router.post('/register/create_admin', createAdmin)

router.post('/register/send_mobile_otp', sendRegistrationMobileOtp)

router.post('/register/send_email_otp', sendRegistrationEmailOtp)

router.post('/register/verify_mobile_otp', verifyRegistrationMobileOtp)

router.post('/register/verify_email_otp', verifyRegistrationEmailOtp)

router.get('/login/verify_company_code', fetchDBFromCompanyCode)

router.post('/login/sendLoginOTP', sendLoginOTP)

router.post('/login/verifyOTP', verifyOTP)

router.post('/login/userLogin', userLogin)

router.post('/login/userLoginWithoutCmpanyCode', userLoginWithoutCmpanyCode)

router.post('/sup/login', superAdminLogin)

router.post('/reset_password',resetPassword)

router.post('/update-email-otp',sendEmailOtp)

router.post('/verify-email-otp',verifyEmailOtp)

router.post('/send-mobile-otp',sendMobileOtp)

router.post('/verify-mobile-otp',verifyMobileOtpforUpdate)

router.post('/validate',authenticateJWT,pageValidteController)

router.post('/logout',authenticateJWT,Logout)

router.post('/sadmin_logout',authenticateJWT,SadminLogout)

module.exports = router;