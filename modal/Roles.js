const createRoleCollection = async (newAdminDb) => {
    await newAdminDb.createCollection('roles', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['id', 'roleName', 'permissionMobile', 'permissionWeb', 'status'],
                properties: {
                    _id: {
                        bsonType: 'objectId',
                        description: 'Must be an ObjectId and is required'
                    },
                    id: {
                        bsonType: 'int',
                        description: 'Role Id is required'
                    },
                    roleName: {
                        bsonType: 'string',
                        description: 'Role name is required',
                    },
                    status: {
                        bsonType: 'bool',
                        description: 'Status is required',
                    },
                    permissionMobile: {
                        bsonType: 'bool',
                        description: 'Permission Status for Mobile is required',
                    },
                    permissionWeb: {
                        bsonType: 'bool',
                        description: 'Permission Status for Web is required',
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
    await newAdminDb.collection('roles').createIndex({ id: 1 }, { unique: true });
    await newAdminDb.collection('roles').createIndex({ roleName: 1 }, { unique: true });
};

module.exports = createRoleCollection;
