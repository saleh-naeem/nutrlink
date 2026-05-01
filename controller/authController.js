const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { OAuth2Client } = require('google-auth-library');
const cloudinary = require('cloudinary').v2;
const User = require('../model/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- CLOUDINARY CONFIG WITH ERROR CHECKING ---
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ CLOUDINARY ERROR: Missing environment variables!');
    console.error('Please add these to your .env file:');
    console.error('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.error('  CLOUDINARY_API_KEY=your_api_key');
    console.error('  CLOUDINARY_API_SECRET=your_api_secret');
    console.error('\nGet credentials from: https://cloudinary.com/console');
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('✅ Cloudinary configured:', process.env.CLOUDINARY_CLOUD_NAME);
}

// --- VALIDATION SCHEMAS ---
const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    password: Joi.string()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,30})'))
        .required()
        .messages({ 'string.pattern.base': 'Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character.' }),
    role: Joi.string().valid('customer', 'nutritionist').required()
});

const loginSchema = Joi.object({
    identifier: Joi.string().required(),
    password: Joi.string().required()
});

// --- HELPER ---
/**
 * Upload a file buffer to Cloudinary and return the secure URL.
 */
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        if (!process.env.CLOUDINARY_API_KEY) {
            return reject(new Error('Cloudinary not configured. Check your .env file.'));
        }

        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return reject(error);
                }
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

// --- CONTROLLER FUNCTIONS ---

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
    const { error } = registerSchema.validate(req.body);
    if (error) { res.status(400); throw new Error(error.details[0].message); }

    const { username, email, password, role } = req.body;

    if (role === 'nutritionist' && !req.file) {
        res.status(400);
        throw new Error('Nutritionists must upload a credential image.');
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
        res.status(409);
        throw new Error(
            userExists.email === email
                ? 'Email is already registered'
                : 'Username is already taken'
        );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let credentialImage = null;
    if (role === 'nutritionist') {
        try {
            credentialImage = await uploadToCloudinary(
                req.file.buffer,
                'nutriplan/credentials'
            );
            console.log('✅ Credential uploaded:', credentialImage);
        } catch (uploadError) {
            console.error('❌ Cloudinary upload failed:', uploadError);
            res.status(500);
            throw new Error('Failed to upload credential image.');
        }
    }

    const isApproved = role === 'customer';

    // FIX: Only include credentialImage. 
    // We EXCLUDE profilePic so Mongoose uses the Schema default.
    const user = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
        isApproved,
        credentialImage,
    });

    if (user) {
        const token = jwt.sign(
            { id: user._id, role: user.role, isadmin: user.isadmin },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isApproved: user.isApproved,
            profilePic: user.profilePic,
            credentialImage: user.credentialImage,
            token,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Login user
// @route   POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const { identifier, password } = req.body;

    const user = await User.findOne({
        $or: [
            { email: identifier },
            { username: identifier }
        ]
    });

    if (user && (await bcrypt.compare(password, user.password))) {
        if (user.role === 'nutritionist' && !user.isApproved) {
            res.status(403);
            throw new Error('Your account is pending admin approval. You will be notified once approved.');
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, isadmin: user.isadmin },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        const { password: _, ...otherDetails } = user._doc;
        res.status(200).json({ ...otherDetails, token });
    } else {
        res.status(401);
        throw new Error('Invalid email/username or password');
    }
});

// @desc    Login/Register via Google
// @route   POST /api/auth/google
const googleLogin = asyncHandler(async (req, res) => {
    const { token, role } = req.body;
    if (!token) { res.status(400); throw new Error('Google token is missing'); }

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();
    let user = await User.findOne({ email });

    if (user) {
        // Only update if picture exists to avoid nulling the existing one
        if (picture) user.profilePic = picture;
        user.username = name.replace(/\s+/g, '').toLowerCase();
        user.lastSeen = new Date();
        await user.save();
    } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Math.random().toString(36), salt);
        const isApproved = (role || 'customer') === 'customer';

        // FIX: Build userData object conditionally
        const userData = {
            username: name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
            email,
            password: hashedPassword,
            role: role || 'customer',
            isApproved,
        };

        // Only add profilePic if Google actually provided one
        if (picture) {
            userData.profilePic = picture;
        }

        user = await User.create(userData);
    }

    if (user.role === 'nutritionist' && !user.isApproved) {
        res.status(403);
        throw new Error('Your account is pending admin approval.');
    }

    const appToken = jwt.sign(
        { id: user._id, role: user.role, isadmin: user.isadmin },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );

    const userObject = user.toObject();
    delete userObject.password;

    res.status(200).json({ ...userObject, token: appToken });
});

module.exports = { registerUser, loginUser, googleLogin };