const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    slug: {
        type: String,
        required: true,
        unique: true
    },
     
    type: {
        type: String
    },

    category: {
        type: String,
        required: true
    },

    subCategory: {
        type: String
    },

    price: {
        type: Number,
        required: true
    },

    offerPrice: {
        type: Number
    },

    discount: {
        type: Number
    },

    rating: {
        type: Number,
        default: 0
    },

    stock: {
        type: Number,
        default: 0
    },

    image: {
        type: String,
        required: true
    },

    images: {
        type: [String]
    },

    description: {
        type: String
    },

    brand: {
        type: String
    },

    featured: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("Product", productSchema)