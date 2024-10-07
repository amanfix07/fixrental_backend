const createUserCollection = async(newAdminDb) => {
    await newAdminDb.createCollection('users', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['firstName', 'lastName', 'email', 'password', 'mobile', 'role', 'status'],
                properties: {
                    firstName: {
                        bsonType: 'string',
                        description: 'First name is required'
                    },
                    middleName: {
                        bsonType: 'string',
                        description: 'Middle name is optional'
                    },
                    lastName: {
                        bsonType: 'string',
                        description: 'Last name is required'
                    },
                    panNumber: {
                        bsonType: 'string',
                        description: 'PAN Number is optional'
                    },
                    email: {
                        bsonType: 'string',
                        description: 'Email is required and must be unique'
                    },
                    password: {
                        bsonType: 'string',
                        description: 'Password is required'
                    },
                    mobile: {
                        bsonType: 'string',
                        description: 'Mobile number is required and must be unique'
                    },
                    role: {
                        bsonType: 'string',
                        description: 'Role is required'
                    },
                    status: {
                        bsonType: 'bool',
                        description: 'Status is required',
                    },
                    otp: {
                        bsonType: 'string',
                        description: 'OTP is optional'
                    },
                    createdAt: {
                        bsonType: 'string',
                        description: 'Created date',
                    },
                    updatedAt: {
                        bsonType: 'string',
                        description: 'Updated date',
                    }
                    
                }
            }
        }
    });
}

module.exports = createUserCollection;