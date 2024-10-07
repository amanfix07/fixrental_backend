const mongoose = require('mongoose');
const client = require('../../db/config/dbConfig');
const createRoleCollection = require('../../modal/Roles');
const masheenDB = client.db('machine_rental');
const roleCollection = masheenDB.collection("roles");
const moment = require('moment-timezone');

const addRole = async (req, res) => {
    try {
        let data = req.body;
        const maxRole = await roleCollection.findOne({}, {
            sort: {
                id: -1
            }
        });
        let id = maxRole ? maxRole.id + 1 : 1;
        id = isNaN(id) ? 1 : id;
        data = {
            ...data, id,
            createdAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A'),
            updatedAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A')
        }
        // console.log(data)
        await createRoleCollection(masheenDB)
        const result = await roleCollection.insertOne(data);
        if (result) return res.status(201).json({ message: "Role Created Successfully" });
        else return res.status(400).json({ message: "Failed to create role" });
    }
    catch (error) {
        // console.log(error)
        return res.status(500).json({ message: "Failed to create role" });
    }
}

const getAllRoles = async (req, res) => {
    try {
        const result = await roleCollection.find({}).toArray();
        // console.log(result)
        if (result) return res.status(200).json(result);
        else return res.status(400).json({ message: "Failed to fetch Roles" });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch Roles" });
    }
}

const deleteRole = async (req, res) => {
    try {
        const id = Number(req.query.id);
        const result = await roleCollection.deleteOne({ id });
        if (!result) return res.status(400).json({ message: "Failed to delete role" });
        else return res.status(200).json({ message: "Role deleted successfully" });
    } catch (error) {
        return res.status(400).json({ message: "Failed to delete role" })
    }
}

const getRole = async (req, res) => {
    try {
        const id = Number(req.query.id);
        const result = await roleCollection.findOne({ id });
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to fetch role" });
        }

    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch role" })
    }
}

const updateRole = async (req, res) => {
    try {
        const id = Number(req.query.id);
        let data = req.body;
        // console.log(id);
        // console.log(data);
        data = {...data, updatedAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A')}
        const result = await roleCollection.findOneAndUpdate({ id }, { $set: data })
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to update role" });
        }

    } catch (error) {
        return res.status(500).json({ message: "Failed to update role" })
    }
}

const updateRoleStatus = async (req, res) => {
    try {
        const id = Number(req.query.id);
        const status = req.body.status;
        // console.log(status)
        const updatedAt = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A');
        const result = await roleCollection.findOneAndUpdate({ id }, { $set: { status, updatedAt } })
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to update role status" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Failed to update role status" })
    }
}

module.exports = {
    addRole, getAllRoles, deleteRole, getRole, updateRole, updateRoleStatus
}