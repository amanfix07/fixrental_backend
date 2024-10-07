const mongoose = require('mongoose');
const client = require('../../db/config/dbConfig')
const masheenDB = client.db('machine_rental');
const menuCollection = masheenDB.collection("menus");
const subMenuCollection = masheenDB.collection("subMenus");
const moment = require('moment-timezone');
const createMenuCollection = require('../../modal/Menu');
const createSubMenuCollection = require('../../modal/SubMenus');
const sectionCollection = masheenDB.collection("menu_sections");

const getAllSections = async (req, res) => {
    try {
        const sections = await sectionCollection.find({}).toArray();
        return res.status(200).json(sections);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch sections", error });
    }
}

const addMenu = async (req, res) => {
    try {
        let data = req.body;

        // Ensure 'subMenus' field is an array if not provided
        if (!Array.isArray(data.subMenus)) {
            data.subMenus = [];
        }

        const maxMenu = await menuCollection.findOne({}, { sort: { id: -1 } });
        let id = maxMenu ? maxMenu.id + 1 : 1;
        id = isNaN(id) ? 1 : id;

        // Find the maximum sub-menu id in the existing collection
        let maxSubMenuId = 0;
        if (data.subMenus.length > 0) {
            const lastSubMenu = await subMenuCollection.findOne({}, { sort: { id: -1 } });
            maxSubMenuId = lastSubMenu ? lastSubMenu.id + 1 : 1;
            maxSubMenuId = isNaN(maxSubMenuId) ? 1 : maxSubMenuId;
        }

        let subMenus = data.subMenus;
        delete data.subMenus;
        // console.log(subMenus,"************************************")

        // Assign auto-incremented ids to subMenus
        // data.subMenus = data.subMenus.map((subMenu, index) => ({
        //     ...subMenu,
        //     id: maxSubMenuId + index + 1 // Increment sub-menu ID
        // }));

        data = {
            ...data,
            id,
            createdAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A'),
            updatedAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A'),
            sequence: Number(data.sequence),
        };
        // console.log(data, "data")

        const result1 = await createMenuCollection(masheenDB);
        // console.log(result1)
        const result2 = await createSubMenuCollection(masheenDB);
        // console.log(result2)
        const result = await menuCollection.insertOne(data);

        await menuCollection.updateMany({sequence:{$gt:data.sequence}},{$inc:{sequence:1}});

        if (subMenus && subMenus.length > 0) {
            let subMenuObject = {}
            let subMenuResult;
            for (let i = 0; i < subMenus.length; i++) {
                if(!subMenus[i].subMenuName)return res.status(400).json({ message: "Sub Menu is Empty" });
                subMenus[i].menu_id = id;
                subMenus[i].createdAt = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A');
                subMenus[i].updatedAt = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A');
                subMenus[i].id = maxSubMenuId + i + 1;
                subMenus[i].sequence = Number(subMenus[i].sequence)
                // console.log(subMenus[i].id)
                subMenuResult = await subMenuCollection.insertOne(subMenus[i]);
            }
            if (result && subMenuResult) return res.status(201).json({ message: "Menu Created Successfully" });
            else return res.status(400).json({ message: "Failed to create menu" });
        }
        if (result) return res.status(201).json({ message: "Menu Created Successfully" });
        else return res.status(400).json({ message: "Failed to create menu" });
    } catch (error) {
        // console.log(error)
        return res.status(500).json({ message: "Failed to create menu" });
    }
};


const getAllMenus = async (req, res) => {
    try {
        // Fetch all menus
        const menus = await menuCollection
        .find({ status: true, menuType: { $in: ["SuperAdmin", "Both"] } })
        // .find({ status: true})
        .sort({ sequence: 1 })
        .toArray();      

        // Fetch all subMenus
        const subMenus = await subMenuCollection.find({subMenuStatus:true}).toArray();
        // console.log(subMenus)
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
};


const deleteMenu = async (req, res) => {
    try {
        const id = Number(req.query.id);

        // Delete the menu
        const menuResult = await menuCollection.deleteOne({ id });

        if (menuResult.deletedCount === 0) {
            return res.status(400).json({ message: "Failed to delete menu" });
        }

        // Delete all submenus associated with the menu
        const subMenuResult = await subMenuCollection.findOneAndDelete({ menu_id: id });

        // if (subMenuResult.deletedCount === 0) {
        //     return res.status(400).json({ message: "Menu deleted, but no submenus found to delete" });
        // }

        return res.status(200).json({ message: "Menu and its submenus deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete menu", error });
    }
};


const getMenu = async (req, res) => {
    try {
        const id = Number(req.query.id);
        const result = await menuCollection.findOne({ id });
        const subMenus = await subMenuCollection.find({ menu_id: id }).toArray();
        result.subMenus = subMenus;
        // console.log(result, "result")
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to fetch menu" });
        }

    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch menu" })
    }
}

const updateMenu = async (req, res) => {
    try {
        const id = Number(req.query.id);
        let data = req.body;
        // console.log(data)
        // console.log(id);
        let seq = Number(data.sequence);
        data = { ...data, sequence:seq, updatedAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A') }
        delete data._id;
        let maxSubMenuId = 0;
        // console.log(data)
        if (data.subMenus.length > 0) {
            const lastSubMenu = await subMenuCollection.findOne({}, { sort: { id: -1 } });
            maxSubMenuId = lastSubMenu ? lastSubMenu.id + 1 : 1;
            maxSubMenuId = isNaN(maxSubMenuId) ? 1 : maxSubMenuId;
        }
        let subMenus = data.subMenus;
        // console.log("object")
        let subMenuObject = {}
        delete data.subMenus;
        console.log(data)
        await menuCollection.updateMany({sequence:{$gte:data.sequence}},{$inc:{sequence:1}});
        const result = await menuCollection.findOneAndUpdate({ id }, { $set: data })
        let subMenuResult;
        if (subMenus && subMenus.length > 0) {
            for (let i = 0; i < subMenus.length; i++) {
                if (!subMenus[i]._id && subMenus[i].subMenuName) {
                    subMenus[i].menu_id = data.id;
                    subMenus[i].updatedAt = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A');
                    subMenus[i].createdAt = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A');
                    subMenus[i].id = maxSubMenuId + i + 1;
                    subMenus[i].sequence = Number(subMenus[i].sequence);
                    subMenuResult = await subMenuCollection.insertOne(subMenus[i]);
                }
            }
        }
        if (result) return res.status(200).json(result);
        else return res.status(400).json({ message: "Failed to update menu" });

    } catch (error) {
        // console.log(error)
        return res.status(500).json({ message: "Failed to update menu" })
    }
}

const updateMenuStatus = async (req, res) => {
    try {
        const id = Number(req.query.id);
        const status = req.body.status;
        // console.log(status)
        const updatedAt = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A')
        const result = await menuCollection.findOneAndUpdate({ id }, { $set: { status, updatedAt } })
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to update menu status" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Failed to update menu status" })
    }
}

const updateSubMenu = async (req, res) => {
    try {
        const subMenuId = Number(req.query.subMenuId, "subMenuId");
        let data = req.body;
        let updatedAt = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A');
        data = {...data, updatedAt}
        // console.log(data)
        delete data._id;
        data.sequence = Number(data.sequence)
        const result = await subMenuCollection.findOneAndUpdate(
            { id:subMenuId },
            { $set: data }
        )
        // console.log(result)
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to update sub-menu" });
        }
    } catch (error) {
        // console.log(error)
        return res.status(500).json({ message: "Failed to update sub-menu" })
    }
}

const getSubMenu = async (req, res) => {
    try {
        const menuId = Number(req.query.menuId);
        const subMenuId = Number(req.query.subMenuId);
        const result = await subMenuCollection
            .findOne({ id: subMenuId });
        // console.log(result, "subMenu")
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to fetch sub-menu" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch sub-menu" })
    }
}

const getSubMenuByMenuid = async (req, res) => {
    try {
        const menuId = Number(req.query.menuId);
        // console.log(menuId, "***********************")
        const result = await subMenuCollection
            .find({ menu_id: menuId }).toArray();
        // console.log(result, "subMenu")
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to fetch sub-menu" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch sub-menu" })
    }
}

const updateSubMenuStatus = async (req, res) => {
    try {
        const subMenuId = Number(req.query.subMenuId);
        const status = req.body.status;
        const updatedAt = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A')
        const result = await subMenuCollection.findOneAndUpdate(
            { id: subMenuId },
            { $set: { "subMenuStatus": status, updatedAt } }
        )
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to update sub-menu status" });
        }
    } catch (error) {
        // // console.log(error.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied[0].details)
        return res.status(500).json({
            message:
                "Failed to update sub-menu status"
        });
    }
}

const deleteSubMenu = async (req, res) => {
    try {
        const menuId = Number(req.query.menuId);
        const subMenuId = Number(req.query.subMenuId);
        const result = await subMenuCollection.findOneAndDelete(
            { id: subMenuId },
        )
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to delete sub-menu" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete sub-menu" })
    }
}

module.exports = {
    addMenu, getAllMenus, deleteMenu, getMenu, updateMenu, updateMenuStatus, updateSubMenu, getSubMenu, updateSubMenuStatus, deleteSubMenu, getSubMenuByMenuid, getAllSections
}