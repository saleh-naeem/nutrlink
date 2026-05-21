const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose'); // 🟢 ADDED: Required to look up the User model dynamically
const Nutritionist = require('../model/Nutritionist');
const Appointment = require('../model/Appointment');
const Customer = require('../model/Customer');

const createProfile = asyncHandler(async (req, res) => {
  const { specialization, bio, yearsOfExperience, clientServed, price, languages } = req.body;

  const existingProfile = await Nutritionist.findOne({ user: req.user.id });
  if (existingProfile) {
    res.status(400);
    throw new Error('Profile already exists for this user');
  }

  const profile = await Nutritionist.create({
    user: req.user.id,
    specialization,
    bio,
    yearsOfExperience,
    clientServed,
    cardBio: req.body.cardBio || bio.substring(0, 150),
    price,
    languages
  });

  res.status(201).json(profile);
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await Nutritionist.findOne({ user: req.user.id })
    .select('user specialization bio yearsOfExperience clientServed rating reviewCount languages price ')
    .populate('user', ['username', 'email', 'profilePic']);

  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  res.json(profile);
});

const getProfileById = asyncHandler(async (req, res) => {
  const profile = await Nutritionist.findOne({ user: req.params.userId }).populate('user', ['username', 'email', 'profilePic']);

  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  res.json(profile);
});

const updateProfile = asyncHandler(async (req, res) => {
  const updatedProfile = await Nutritionist.findOneAndUpdate(
    { user: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedProfile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  res.json(updatedProfile);
});

const getAllNutritionist = asyncHandler(async (req, res) => {
  const nutritionists = await Nutritionist.find().populate('user', ['username', 'email']);

  if (!nutritionists || nutritionists.length === 0) {
    res.status(404);
    throw new Error('No nutritionists found');
  }

  res.json({
    count: nutritionists.length,
    nutritionists
  });
});

const getFilteredCards = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  // 🟢 CHANGED: Extracted 'search' from req.query
  const { specialization, languages, maxPrice, minRating, yearsOfExperience, sortBy, search } = req.query;

  let queryFilter = {};

  if (specialization) {
    queryFilter.specialization = {
      $in: Array.isArray(specialization) ? specialization : [specialization]
    };
  }

  if (languages) {
    queryFilter.languages = {
      $in: Array.isArray(languages) ? languages : [languages]
    };
  }

  if (maxPrice) queryFilter.price = { $lte: parseFloat(maxPrice) };
  if (minRating) queryFilter.rating = { $gte: parseFloat(minRating) };
  if (yearsOfExperience) queryFilter.yearsOfExperience = { $gte: parseInt(yearsOfExperience) };

  const sortMap = {
    price: { price: 1 },
    reviewCount: { reviewCount: -1 },
    rating: { rating: -1 }
  };

  const sortOptions = sortMap[sortBy] || { rating: -1 };

  const availableNutritionistIds = await Appointment.find({
    status: "available"
  }).distinct("nutritionistId");

  // 🟢 CHANGED: Process relationship lookup across collections if search input is active
  if (search && search.trim() !== "") {
    const User = mongoose.model('User');
    
    // Find all users matching the search term inside their username
    const matchingUsers = await User.find({
      username: { $regex: search, $options: "i" } // 'i' flag ensures case insensitivity
    }).distinct("_id");

    // Convert ObjectIds to strings to accurately calculate array intersection
    const availableStrings = availableNutritionistIds.map(id => id.toString());
    const matchedStrings = matchingUsers.map(id => id.toString());
    
    // Intersect: Only keep the user IDs that have available appointments AND match the search name
    const validUserIds = matchedStrings.filter(id => availableStrings.includes(id));

    queryFilter.user = { $in: validUserIds };
  } else {
    // Default fallback when search is completely empty
    queryFilter.user = { $in: availableNutritionistIds };
  }

  const total = await Nutritionist.countDocuments(queryFilter);

  const cards = await Nutritionist.find(queryFilter)
    .populate("user", ["username", "profilePic"])
    .select("specialization cardBio rating reviewCount price languages yearsOfExperience")
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  res.json({
    count: cards.length,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    cards
  });
});

const getRecommendedForUser = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ user: req.user.id });

  if (!customer || !customer.primaryGoal)
    return res.json([]);

  const primaryGoal = customer.primaryGoal;
  const userLanguages = customer.languages || [];

  const availableNutritionistIds = await Appointment.find({ status: 'available' }).distinct('nutritionistId');

  let recommended = await Nutritionist.find({
    $and: [
      { specialization: primaryGoal },
      { languages: { $in: userLanguages } },
      { user: { $in: availableNutritionistIds } }
    ]
  })
    .populate('user', ['username', 'profilePic'])
    .select('specialization cardBio rating reviewCount price languages')
    .sort({ rating: -1 })
    .limit(10)
    .lean();

  if (recommended.length === 0) {
    const goalOnlyMatch = await Nutritionist.find({
      specialization: primaryGoal,
      user: { $in: availableNutritionistIds }
    })
      .populate('user', ['username', 'profilePic'])
      .select('specialization cardBio rating reviewCount price languages')
      .sort({ rating: -1 })
      .limit(10)
      .lean();

    return res.json(goalOnlyMatch);
  }

  res.json(recommended);
});

module.exports = { 
  createProfile, 
  getProfile, 
  getProfileById, 
  updateProfile, 
  getAllNutritionist, 
  getFilteredCards, 
  getRecommendedForUser 
};