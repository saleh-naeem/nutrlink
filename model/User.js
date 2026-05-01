const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['customer', 'nutritionist'],
        required: true
    },
    isadmin: {
        type: Boolean,
        default: false
    },
    // Nutritionists start unapproved; customers are auto-approved on register
    isApproved: {
        type: Boolean,
        default: false
    },
    profilePic: {
        type: String,
        default: "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
    },
    // Stores the Cloudinary URL of the nutritionist's credential image
    credentialImage: {
        type: String,
        default: null
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);