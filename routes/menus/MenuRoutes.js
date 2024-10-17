const express = require('express');
const { getAllMenus, getAllMenusForSideBar } = require('../../controller/menu/MenuController');
const {authenticateJWT} = require('../../middlewares/jwtVerification')
const menuRouter = express.Router();

menuRouter.get('/getAll', getAllMenus)

menuRouter.get('/getAllMenusForSideBar', authenticateJWT, getAllMenusForSideBar)

module.exports = menuRouter;