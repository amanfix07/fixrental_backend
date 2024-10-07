const express = require('express');
const {getAllUsers, addUser,getUserById, getAllRoles} = require('../../../controller/admin/UserController');
const { authenticateJWT } = require('../../../middlewares/jwtVerification');
const userRouter = express.Router();




userRouter.get('/allUsers', authenticateJWT, getAllUsers);
userRouter.post('/addUser', authenticateJWT, addUser);
userRouter.get('/getUserById/:id', authenticateJWT, getUserById);
userRouter.get('/getRoles',authenticateJWT, getAllRoles);




module.exports = userRouter;