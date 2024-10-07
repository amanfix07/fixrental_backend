const createMachineStatusCollection = async (newAdminDb) => {
    await newAdminDb.createCollection('machineStatus', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['id', 'statusName', 'status', 'backgroundColor', 'textColor', 'section'],
                properties: {
                    _id: {
                        bsonType: 'objectId',
                        description: 'Must be an ObjectId and is required'
                    },
                    id: {
                        bsonType: 'int',
                        description: 'Id is required'
                    },
                    statusName: {
                        bsonType: 'string',
                        description: 'Machine Status name is required',
                    },
                    section: {
                        bsonType: 'string',
                        description: 'Machine Status Section is required',
                    },
                    backgroundColor: {
                        bsonType: 'string',
                        description: 'Background Color is required',
                    },
                    textColor: {
                        bsonType: 'string',
                        description: 'Color is required',
                    },
                    status: {
                        bsonType: 'bool',
                        description: 'Status is required',
                    },
                    createdAt: {
                        bsonType: 'string',
                        description: 'Created date',
                    },
                    updatedAt: {
                        bsonType: 'string',
                        description: 'Updated date',
                    }
                },
                additionalProperties: false
            }
        }
    });

    // Create unique indexes for fields that should be unique
    await newAdminDb.collection('machineStatus').createIndex({ id: 1 }, { unique: true });
    await newAdminDb.collection('machineStatus').createIndex({ statusName: 1 }, { unique: true });
};

module.exports = createMachineStatusCollection;
