const asyncHandler = require('express-async-handler')
// const Profile = require('../model/customer')
const Customer = require('../model/Customer')
const cloudinary = require('cloudinary').v2;
const User = require('../model/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadProfilePic = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'nutriplan/profiles', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};



const createProfile = asyncHandler(async (req, res) => {
  const { age, gender, height, currentWeight, targetWeight, allergies, primaryGoal } = req.body;

  const existingProfile = await Customer.findOne({ user: req.user.id })
  if (existingProfile) {
    res.status(400)
    throw new Error('Profile already exists for this user')
  }

  const profile = await Customer.create({
    user: req.user.id,
    age,
    gender,
    height,
    startingWeight: currentWeight,
    currentWeight,
    targetWeight,
    allergies,
    primaryGoal,
  });

  res.status(201).json(profile)
});

// 2. Get Current User's Profile
const getProfile = asyncHandler(async (req, res) => {
  // Find profile and populate user details
  const profile = await Customer.findOne({ user: req.user.id }).populate('user', ['username', 'email', 'profilePic']);

  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  res.json(profile);
});

const getProfileById = asyncHandler(async (req, res) => {
  // Use $or to check if the ID is the User ID OR the Profile ID
  const profile = await Customer.findOne({
    $or: [
      { user: req.params.id }, // Check if it's a User ID
      { _id: req.params.id }   // Check if it's a Customer ID
    ]
  }).populate('user', ['username', 'email', 'profilePic']);

  if (!profile) {
    res.status(404);
    throw new Error('Profile not found in database');
  }

  res.json(profile);
});

const updateProfile = asyncHandler(async (req, res) => {
  // Find the user's profile and update it with the new data
  const updatedProfile = await Customer.findOneAndUpdate(
    { user: req.user.id }, // 1. Who to update
    req.body,              // 2. What data to update
    { new: true, runValidators: true } // 3. Options
  );

  // If no profile was found to update
  if (!updatedProfile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  res.json(updatedProfile);
});

const updateProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400)
    throw new Error('No image file provided')
  }

  let newProfilePicUrl
  try {
    newProfilePicUrl = await uploadProfilePic(req.file.buffer)
  } catch (err) {
    res.status(500)
    throw new Error('IMage upload to Cloudinary failed')
  }

  const targetId = req.user._id || req.user.id;

  const updatedUser = await User.findByIdAndUpdate(
    targetId,
    { profilePic: newProfilePicUrl },
    { returnDocument: 'after', select: '-password' } // Fixed deprecation warning
  );

  if (!updatedUser) {
    res.status(404);
    throw new Error(`User not found with ID: ${targetId}`);
  }

  res.status(200).json({ profilePic: updatedUser.profilePic });
})


//creat new goal
// rout: nutrlink/api/customer/goal/
const createGoal = asyncHandler(async (req, res) => {
  const newGoal = {
    data: req.body.data,
  }
  const goal = await Customer.findOneAndUpdate(
    { user: req.user.id },
    { $push: { goals: newGoal } },
    { new: true })
  if (!goal) { return res.status(404).json("the customer not found") }
  res.status(201).json(goal)
})
//make goal as done
// rout: nutrlink/api/customer/goal/
const goalDone = asyncHandler(async (req, res) => {
  const goal = await Customer.findOneAndUpdate({ user: req.user.id, "goals._id": req.body.goal_id },
    { $set: { "goals.$.status": "done" } }, { new: true })
  if (!goal) { return res.status(404).json("the customer not found or the goal id is wrong") }
  res.status(200).json(goal)
})
//remove goal 
// rout: nutrlink/api/customer/goal/
const deleteGoal = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndUpdate(
    { user: req.user.id },
    { $pull: { goals: { _id: req.params.goal_id } } },
    { new: true } // This returns the updated document
  );

  if (!customer) {
    return res.status(404).json({ message: "Customer profile not found" });
  }
  res.status(200).json(customer.goals);
});

//get all goal 
// rout: nutrlink/api/customer/goal
const getGoal = asyncHandler(async (req, res) => {
  const goal = await Customer.findOne({ user: req.user.id },
    { goals: 1, _id: 0 }
  )
  if (!goal) { return res.status(404).json("the customer not found") }
  res.status(200).json(goal)
})
module.exports = { createProfile, getProfile, getProfileById, updateProfile, updateProfilePicture, createGoal, goalDone, deleteGoal, getGoal }

