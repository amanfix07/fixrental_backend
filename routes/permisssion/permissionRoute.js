const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../../middlewares/jwtVerification');

const {addPermission,getAllMenusByPermissionId} = require('../../controller/Permisssion/permissionController');

router.post('/add_permission', authenticateJWT,addPermission)
 
router.get('/get_permission', authenticateJWT,getAllMenusByPermissionId)

router.post('/update_permission', authenticateJWT,addPermission)

module.exports = router;