const express = require('express');
const { getAllMenus, getAllMenusForSideBar } = require('../../controller/menu/MenuController');
const {authenticateJWT} = require('../../middlewares/jwtVerification')
const router = express.Router();

router.get('/getAll', getAllMenus)

router.get('/getAllMenusForSideBar', authenticateJWT, getAllMenusForSideBar)

module.exports = router;