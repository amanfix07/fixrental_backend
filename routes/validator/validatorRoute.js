const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../../middlewares/jwtVerification');

const {pageValidteController} = require('../../controller/validator/userValidteController');

router.post('/validate', authenticateJWT,pageValidteController)

module.exports = router;