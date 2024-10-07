const express = require('express');
const { authenticateJWT } = require('../../middlewares/jwtVerification');
const { getAllAdmins, changeAdminStatus,deleteAdmins,deleteAdmin } = require('../../controller/super_admin/AdminController');
const { createAdmin } = require('../../controller/auth/authController');
const { addRole, getAllRoles,deleteRole, getRole, updateRole, updateRoleStatus } = require('../../controller/super_admin/Roles');
const { addMenu, getAllMenus,deleteMenu, getMenu, updateMenu, updateMenuStatus, updateSubMenu, getSubMenu,updateSubMenuStatus, deleteSubMenu, getSubMenuByMenuid, getAllSections } = require('../../controller/super_admin/Menus');
const { fetchDashboardData, fetchCompanyRegisteredThisMonth, fetchCompanyCountChartData } = require('../../controller/super_admin/SuperAdminController');
const { addMachineStatus, getAllMachineStatus, deleteMachineStatus, getMachineStatus, updateMachineStatus, updateMachineStatusStatus } = require('../../controller/super_admin/MachineStatus');
const { updateAdmin, getAdminById } = require('../../controller/admin/AdminController');
const router = express.Router();

router.get("/menu/sections/getall", getAllSections)

router.get('/get_admins', authenticateJWT, getAllAdmins);

router.post('/add_admin', authenticateJWT, createAdmin);

router.delete('/delete_admin', authenticateJWT, deleteAdmin);

router.delete('/delete_admins', authenticateJWT, deleteAdmins);

router.post('/change_status', authenticateJWT, changeAdminStatus);

router.post('/role/add', addRole);

router.get('/role/getAll', getAllRoles);

router.delete('/role/delete', deleteRole);

router.get('/role/get', getRole);

router.put('/role/update', updateRole);

router.put('/role/status/update', updateRoleStatus);


router.post('/menu/add', addMenu);

router.get('/menu/getAll', getAllMenus);

router.delete('/menu/delete', deleteMenu);

router.get('/menu/get', getMenu);

router.put('/menu/update', updateMenu);

router.put('/menu/status/update', updateMenuStatus);

router.get('/menu/submenu/get', getSubMenu);

router.get('/menu/submenu/get-by-menu', getSubMenuByMenuid);

router.put('/menu/submenu/update', updateSubMenu);

router.put('/menu/submenu/status/update', updateSubMenuStatus);

router.delete('/menu/submenu/delete', deleteSubMenu);

router.get('/dashboard/company-counts', fetchDashboardData);

router.get('/dashboard/monthly-companies', fetchCompanyRegisteredThisMonth);

router.get('/dashboard/monthly-company-count', fetchCompanyCountChartData);


router.post('/machineStatus/add', addMachineStatus);

router.get('/machineStatus/getAll', getAllMachineStatus);

router.delete('/machineStatus/delete', deleteMachineStatus);

router.get('/machineStatus/get', getMachineStatus);

router.put('/machineStatus/update', updateMachineStatus);

router.put('/machineStatus/status', updateMachineStatusStatus);

router.put('/profile/update', updateAdmin);
router.get('/profile/get-by-id', getAdminById);

module.exports = router;