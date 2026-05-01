const express = require('express');
const router = express.Router();
const authToken = require('../middleware/verifyToken');
const multer = require('multer');

// Configure multer to hold the file in memory (required for your Cloudinary stream)
const upload = multer({ storage: multer.memoryStorage() });

const { 
    createProfile, getProfile, getProfileById, updateProfile, 
    updateProfilePicture, createGoal, goalDone, deleteGoal, getGoal
} = require('../controller/customerController');

// ─── Profile Routes ──────────────────────────────────────────
// Base route: /api/customer/
router.post('/', authToken, createProfile);
router.get('/me', authToken, getProfile);
router.put('/me', authToken, updateProfile);

// The new profile picture route
router.put('/profile-picture', authToken, upload.single('profilePic'), updateProfilePicture);

router.get('/profile/:userId', authToken, getProfileById);


// ─── Goal Management Routes ──────────────────────────────────
// Base route: /api/customer/goal/

// 1. Get all goals for the current user
router.get('/goal', authToken, getGoal);

// 2. Add a new goal
router.post('/goal', authToken, createGoal);

// 3. Mark a specific goal as "done"
router.put('/goal/done', authToken, goalDone);

// 4. Delete a specific goal
router.delete('/goal/:goal_id', authToken, deleteGoal);

module.exports = router;