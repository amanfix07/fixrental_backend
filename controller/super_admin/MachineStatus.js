const mongoose = require('mongoose');
const client = require('../../db/config/dbConfig');
const createMachineStatusCollection = require('../../modal/MachineStatus');
const masheenDB = client.db('machine_rental');
const machineStatusCollection = masheenDB.collection("machineStatus");
const moment = require('moment-timezone');

const addMachineStatus = async (req, res) => {
    try {
        let data = req.body;
        const maxMachineStatus = await machineStatusCollection.findOne({}, {
            sort: {
                id: -1
            }
        });
        let id = maxMachineStatus ? maxMachineStatus.id + 1 : 1;
        id = isNaN(id) ? 1 : id;
        data = {
            ...data, id,
            createdAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A'),
            updatedAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A')
        }
        // console.log(data)
        await createMachineStatusCollection(masheenDB)
        console.log(data)
        const result = await machineStatusCollection.insertOne(data);
        // console.log(result)
        if (result) return res.status(201).json({ message: "Machine Status Created Successfully" });
        else return res.status(400).json({ message: "Failed to create Machine Status" });
    }
    catch (error) {
        // console.log(error)
        return res.status(500).json({ message: "Failed to create Machine Status" });
    }
}

const getAllMachineStatus = async (req, res) => {
    try {
        const result = await machineStatusCollection.find({}).toArray();
        console.log(result)
        if (result) return res.status(200).json(result);
        else return res.status(400).json({ message: "Failed to fetch Machine Status" });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch Machine Status" });
    }
}

const deleteMachineStatus = async (req, res) => {
    try {
        const id = Number(req.query.id);
        console.log(req.query)
        const result = await machineStatusCollection.deleteOne({ id });
        if (!result) return res.status(400).json({ message: "Failed to delete Machine Status" });
        else return res.status(200).json({ message: "Machine Status deleted successfully" });
    } catch (error) {
        return res.status(400).json({ message: "Failed to delete Machine Status" })
    }
}

const getMachineStatus = async (req, res) => {
    try {
        const id = Number(req.query.id);
        const result = await machineStatusCollection.findOne({ id });
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to fetch Machine Status" });
        }

    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch Machine Status" })
    }
}

const updateMachineStatus = async (req, res) => {
    try {
        const id = Number(req.query.id);
        let data = req.body;
        // console.log(id);
        // console.log(data);
        data = {...data, updatedAt: moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A')}
        const result = await machineStatusCollection.findOneAndUpdate({ id }, { $set: data })
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to update Machine Status" });
        }

    } catch (error) {
        return res.status(500).json({ message: "Failed to update Machine Status" })
    }
}

const updateMachineStatusStatus = async (req, res) => {
    try {
        const id = Number(req.query.id);
        const status = req.body.status;
        // console.log(status)
        const updatedAt = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A');
        const result = await machineStatusCollection.findOneAndUpdate({ id }, { $set: { status, updatedAt } })
        if (result) return res.status(200).json(result);
        else {
            return res.status(400).json({ message: "Failed to update Machine Status status" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Failed to update Machine Status status" })
    }
}

module.exports = {
    addMachineStatus, getAllMachineStatus, deleteMachineStatus, getMachineStatus, updateMachineStatus, updateMachineStatusStatus
}