const createMenuCollection = async (newAdminDb) => {
    await newAdminDb.createCollection('menus', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['id', 'section', 'menuName', 'menuIconType', 'menuIcon', 'menuRoutename', 'status', 'sequence', 'menuType'],
                properties: {
                    _id: {
                        bsonType: 'objectId',
                        description: 'Must be an ObjectId and is required'
                    },
                    id: {
                        bsonType: 'int',
                        description: 'Menu ID is required'
                    },
                    menuName: {
                        bsonType: 'string',
                        description: 'Menu Name is required'
                    },
                    section: {
                        bsonType: 'string',
                        description: 'Section is required'
                    },
                    menuType: {
                        bsonType: 'string',
                        description: 'Menu Type is required'
                    },
                    menuIcon: {
                        bsonType: 'string',
                        description: 'Menu Icon is required'
                    },
                    menuRoutename: {
                        bsonType: 'string',
                        description: 'Menu Route is required'
                    },
                    menuIconType: {
                        bsonType: 'string',
                        description: 'Menu Icon Type is required'
                    },
                    status: {
                        bsonType: 'bool',
                        description: 'Status is required'
                    },
                    sequence: {
                        bsonType: 'int',
                        description: 'Sequence is required'
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
                additionalProperties: false,
            }
        }
    });

    // Create unique indexes for fields that should be unique
    await newAdminDb.collection('menus').createIndex({ id: 1 }, { unique: true });
    // await newAdminDb.collection('menus').createIndex({ menuName: 1 }, { unique: true });
    // await newAdminDb.collection('menus').createIndex({ sequence: 1 }, { unique: true });
    await newAdminDb.collection('menus').createIndex({ menuRoutename: 1 }, { unique: true });
};

module.exports = createMenuCollection;
