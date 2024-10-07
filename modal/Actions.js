const { default: mongoose } = require('mongoose');

const Schema = mongoose.Schema;

const action = new Schema({
    action_id:{
        type: Number,
        required: true,
    },
    action_name: {
        type: String,
        required: true,
    },
    action_route: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        required: true
    },
});
