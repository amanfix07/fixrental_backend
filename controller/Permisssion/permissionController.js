const mongoose = require('mongoose');
const client = require('../../db/config/dbConfig');
const createPermissionCollection = require('../../modal/Permission');
const moment = require('moment-timezone');
const mainDB = client.db("machine_rental")

const addPermission = async (req, res) => {
    const { companyCode } = req.userInfo;
    const companyDB = client.db(companyCode);
    await createPermissionCollection(companyDB);
    const permissionCollection = companyDB.collection("permissions");

    try {
        let data = req.body;
        let role = req.body.role_id;
        // console.log(role, "****")

        const maxPermission = await permissionCollection.findOne({}, {
            sort: {
                id: -1
            }
        });
        let id = maxPermission ? maxPermission.id + 1 : 1;
        id = isNaN(id) ? 1 : id;
        data = {
            ...data, id,
            createdAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A'),
            updatedAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A')
        }
        // console.log(data, "-----------------------")
        const permissionFromDB = await permissionCollection.findOne({ role_id: role });
        if (permissionFromDB) {
            delete data._id;
            delete data.id
            const result = await permissionCollection.updateOne({ role_id: role }, { $set: data });
            if (result) return res.status(201).json({ message: "Role Updated Successfully" });
            else return res.status(400).json({ message: "Failed to update role" });
        }
        const result = await permissionCollection.insertOne(data);
        if (result) return res.status(201).json({ message: "Role Created Successfully" });
        else return res.status(400).json({ message: "Failed to create role" });
    }
    catch (error) {
        // console.log(error)
        return res.status(500).json({ message: "Failed to create role" });
    }
}


const getAllMenusByPermissionId = async (req, res) => {
    const { companyCode } = req.userInfo;
    const {role} = req.userInfo;
    // console.log(role,"**")
    let roleID = req.query.roleId; // Get roleId from request params
    roleID = Number(roleID);
    // // console.log(`Fetching menus for permissionId: ${roleID} in company code: ${companyCode}`);
    const companyDB = client.db(companyCode);

    try {
        // Fetch the specific permission by roleID
        const permission = await companyDB.collection('permissions').findOne({ role_id: roleID });
        // // console.log('Permission fetched:', permission);

        // Fetch all menus from the mainDB
        const menus = await mainDB.collection('menus').find( {menuType: { $in: [role, "BOTH"] } }).sort({sequence:1}).toArray();
        // // console.log('Menus fetched:', menus);

        // Fetch all subMenus from the mainDB
        const subMenus = await mainDB.collection('subMenus').find({}).toArray();
        // // console.log('SubMenus fetched:', subMenus);
        // if (!permission) {
        // }

        // Create a mapping of subMenus by menu_id
        const subMenusMap = subMenus.reduce((acc, subMenu) => {
            if (!acc[subMenu.menu_id]) {
                acc[subMenu.menu_id] = [];
            }
            acc[subMenu.menu_id].push({
                id: subMenu.id,
                subMenuName: subMenu.subMenuName,
                read: permission && permission.permission_subMenu?.[subMenu.id]?.read || false,
                write: permission && permission.permission_subMenu?.[subMenu.id]?.write || false,
            });
            return acc;
        }, {});

        // Map the permissions to menus
        const mappedData = menus.map(menu => {
            return {
                id: menu.id,
                menuName: menu.menuName,
                read: permission && permission.permission_menu?.[menu.id]?.read || false,
                write: permission && permission.permission_menu?.[menu.id]?.write || false,
                subMenus: subMenusMap[menu.id] || [],
            };
        });

        // Return the mapped data
        return res.status(200).json({mappedData, permission});

    } catch (error) {
        console.error('Error fetching menus by Role Id:', error);
        return res.status(500).json({ message: "Failed to fetch menus by permissionId", error });
    }
};
module.exports = {
    addPermission,
    getAllMenusByPermissionId,
}