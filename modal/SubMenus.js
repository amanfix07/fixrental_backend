const createSubMenuCollection = async (newAdminDb) => {
    await newAdminDb.createCollection('subMenus', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['id', 'subMenuName', 'subMenuRouteName', 'subMenuStatus', 'subMenuIcon', 'sequence', 'menu_id'],
                properties: {
                    _id: {
                        bsonType: 'objectId',
                        description: 'Must be an ObjectId and is required'
                    },
                    id: {
                        bsonType: 'int',
                        description: 'Sub Menu ID is required'
                    },
                    menu_id: {
                        bsonType: 'int',
                        description: 'Menu ID is required'
                    },
                    subMenuName: {
                        bsonType: 'string',
                        description: 'Sub Menu Name is required',
                    },
                    subMenuRouteName: {
                        bsonType: 'string',
                        description: 'Sub Menu Route Name is required',
                    },
                    subMenuIcon: {
                        bsonType: 'string',
                        description: 'Sub Menu Icon is required',
                    },
                    subMenuStatus: {
                        bsonType: 'bool',
                        description: 'Sub Menu Status is required'
                    },
                    sequence: {
                        bsonType: 'int',
                        description: 'Sequence is required',
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
            },
        },
    });

    // Create unique indexes for fields that should be unique
    await newAdminDb.collection('subMenus').createIndex({ id: 1 }, { unique: true });
    await newAdminDb.collection('subMenus').createIndex({ subMenuName: 1 }, { unique: true });
    await newAdminDb.collection('subMenus').createIndex({ subMenuRouteName: 1 }, { unique: true });
};

module.exports = createSubMenuCollection;
