const express  = require('express');
const multer   = require('multer');
const router   = express.Router();
const authToken = require('../middleware/verifyToken');
const { registerUser, loginUser, googleLogin } = require('../controller/authController');

// --- MULTER (memory storage — buffer passed to Cloudinary) ---
const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, or WEBP images are allowed for credentials.'));
        }
    },
});
// --- ROUTES ---

// POST /api/auth/register
// Accepts multipart/form-data so nutritionists can upload a credential image.
// The field name for the image is "credentialImage".
router.post('/register', upload.single('credentialImage'), registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/google
router.post('/google', googleLogin);

// Test route (protected)
router.get('/', authToken, (_req, res) => {
    res.status(200).json('Work done');
});

module.exports = router;