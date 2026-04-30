const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true      
    },
    password: { 
        type: String, 
        required: true 
    },
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' 
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, { timestamps: true }); 
module.exports = mongoose.model("User", userSchema);