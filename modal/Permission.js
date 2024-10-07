const createRolePermissionsCollection = async (newAdminDb) => {
    await newAdminDb.createCollection('permissions', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['id','role_id', 'permission_menu'],
                properties: {
                    _id: {
                        bsonType: 'objectId',
                        description: 'Must be an ObjectId and is required'
                    },
                    id: {
                        bsonType: 'int',
                        description: 'Must be an Int Id and is required'
                    },
                    role_id: {
                        bsonType: 'int',
                        description: 'Role ID is required and must be an integer'
                    },
                    permission_menu: {
                        bsonType: 'object',
                        description: 'Permissions for each menu, with write and read flags',
                        patternProperties: {
                            '^[0-9]+$': {
                                bsonType: 'object',
                                description: 'Permissions for a specific menu',
                                properties: {
                                    write: {
                                        bsonType: 'bool',
                                        description: 'Write permission for the menu'
                                    },
                                    read: {
                                        bsonType: 'bool',
                                        description: 'Read permission for the menu'
                                    }
                                },
                                additionalProperties: false
                            }
                        },
                        additionalProperties: false
                    },
                    permission_subMenu: {
                        bsonType: 'object',
                        description: 'Permissions for each submenu, with write and read flags',
                        patternProperties: {
                            '^[0-9]+$': {
                                bsonType: 'object',
                                description: 'Permissions for a specific submenu',
                                properties: {
                                    write: {
                                        bsonType: 'bool',
                                        description: 'Write permission for the submenu'
                                    },
                                    read: {
                                        bsonType: 'bool',
                                        description: 'Read permission for the submenu'
                                    }
                                },
                                additionalProperties: false
                            }
                        },
                        additionalProperties: false
                    },
                    createdAt: {
                        bsonType: 'string',
                        description: 'Created date'
                    },
                    updatedAt: {
                        bsonType: 'string',
                        description: 'Updated date'
                    }
                },
                additionalProperties: false
            }
        }
    });
};

module.exports = createRolePermissionsCollection;
