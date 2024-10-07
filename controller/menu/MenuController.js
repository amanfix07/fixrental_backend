const mongoose = require('mongoose');
const client = require('../../db/config/dbConfig')
const machineRentalDB = client.db("machine_rental");
const menuCollection = machineRentalDB.collection("menus");
const subMenuCollection = machineRentalDB.collection("subMenus");

const getAllMenus = async (req, res) => {
    try {
        // Fetch all menus
        const menus = await menuCollection.find({}).sort({ sequence: 1 }).toArray();

        // Fetch all subMenus
        const subMenus = await subMenuCollection.find({}).toArray();
        // // console.log(subMenus, "******")
        const menuWithSubMenus = menus.map(menu => {
            const relatedSubMenus = subMenus.filter(subMenu => subMenu.menu_id === menu.id);
            return {
                ...menu,
                subMenus: relatedSubMenus
            };
        });

        if (menuWithSubMenus.length > 0) {
            // // console.log(menuWithSubMenus, "database")
            return res.status(200).json(menuWithSubMenus);
        } else {
            return res.status(400).json({ message: "Failed to fetch menus" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch menus", error });
    }
}


const getAllMenusForSideBar = async (req, res) => {
    try {
        const role = req.userInfo.role;
        let menus;

        if (role === "SUPERADMIN") {
            menus = await menuCollection.find({ status: true, menuType: "SUPERADMIN" })
                .sort({ sequence: 1 })
                .toArray();
        } else {
            const { companyCode, role } = req.userInfo;
            const roleDetails = await machineRentalDB.collection("roles").findOne({ roleName: new RegExp(role, 'i') });

            if (!roleDetails) {
                return res.status(400).json({ message: "Unauthorized Access" });
            }

            const permission = await client.db(companyCode).collection("permissions").findOne({ role_id: roleDetails.id });
            if (!permission) {
                return res.status(401).json({ message: "Access Denied!!" });
            }

            const menuIds = Object.keys(permission.permission_menu)
                .filter(menuId => permission.permission_menu[menuId].read)
                .map(Number);

            menus = await machineRentalDB.collection("menus").find({ id: { $in: menuIds }, section: { $ne: "Hidden" } }).toArray();
        }

        if (!menus || menus.length === 0) {
            return res.status(400).json({ message: "Failed to fetch menus" });
        }

        const menuIds = menus.map(menu => menu.menu_id || menu.id); // Use menu.id or menu.menu_id based on your data structure
        const subMenus = await subMenuCollection.find({
            subMenuStatus: true,
            menu_id: { $in: menuIds }
        }).toArray();

        const menuWithSubMenus = menus.map(menu => {
            const relatedSubMenus = subMenus.filter(subMenu => subMenu.menu_id === menu.id).sort((a, b) => a.sequence - b.sequence);
            return {
                ...menu,
                subMenus: relatedSubMenus
            };
        }).sort((a, b) => a.sequence - b.sequence); // Sort by sequence

        return res.status(200).json(menuWithSubMenus);

    } catch (error) {
        console.error("Error fetching menus:", error);
        return res.status(500).json({ message: "Failed to fetch menus", error });
    }
}



module.exports = { getAllMenus, getAllMenusForSideBar }
