    const mongoose = require('mongoose');

    const customerProfileSchema = new mongoose.Schema({
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true // Ensures a 1-to-1 relationship
        },
        age: Number,
        gender: { type: String, enum: ['Male', 'Female'] },
        height: Number, // in cm
        startingWeight: Number,
        currentWeight: Number, // in kg
        targetWeight: Number,
        allergies: [String],
        primaryGoal: {
            type: String,
            enum: ['Weight Loss', 'General Health', 'Muscle Building', 'Sports Nutrition', 'Clinical Nutrition',
                'Diabetic Diet', 'Pregnancy Nutrition', 'Vegan Nutrition'],
            required: false
        },
        goals: [{
            data: { type: String },
            status: {
                type: String,
                enum: ["done", "pending"],
                default: "pending"
            }
        }]
    }, { timestamps: true });

    module.exports = mongoose.model('Customer', customerProfileSchema);