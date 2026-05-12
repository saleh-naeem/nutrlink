const asyncHandler = require('express-async-handler')
const Diet = require('../model/DietPlan')
const Nutritionist = require('../model/Nutritionist')
const Customer = require('../model/Customer')
const Appointment = require('../model/Appointment');
const DailyLog = require('../model/Progress');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Recalculate progress% and status from meals array, then save. */
async function recalcProgress(diet) {
    const totalMeals = diet.meals.length;
    const completedCount = diet.meals.filter(m => m.isCompleted).length;
    const progressPercentage = totalMeals === 0 ? 0 : Math.round((completedCount / totalMeals) * 100);

    diet.progress = progressPercentage;

    if (totalMeals === 0 || progressPercentage === 0)
        diet.status = 'pending';
    else if (progressPercentage === 100)
        diet.status = 'completed';
    else
        diet.status = 'in progress';

    await diet.save();
    return progressPercentage;
}

// ─────────────────────────────────────────────────────────────────────────────
// DIET PLAN CRUD
// ─────────────────────────────────────────────────────────────────────────────

const createDiet = asyncHandler(async (req, res) => {
    const { customerId, startDate, endDate, meals } = req.body

    const nutritionistProfile = await Nutritionist.findOne({ user: req.user.id }).select('_id')
    if (!nutritionistProfile) {
        res.status(404);
        throw new Error('Nutritionist profile not found. Please complete your profile setup.');
    }

    const newDiet = await Diet.create({
        nutritionistId: nutritionistProfile._id,
        customerId, // Customer profile _id from frontend
        startDate,
        endDate,
        meals
    })

    res.status(201).json({
        message: 'Diet plan assigned successfully',
        diet: newDiet
    })
});

const updateDiet = asyncHandler(async (req, res) => {
    if (Object.keys(req.body).length === 0)
        return res.status(400).json({ message: "No update data provided" });

    const dietId = req.params.id
    const diet = await Diet.findById(dietId)

    if (!diet) { res.status(404); throw new Error('Diet plan not found') }

    const nutritionistProfile = await Nutritionist.findOne({ user: req.user.id }).select('_id');
    if (!nutritionistProfile || diet.nutritionistId.toString() !== nutritionistProfile._id.toString()) {
        res.status(403); throw new Error('Not authorized to update this diet plan')
    }

    const updatedDiet = await Diet.findByIdAndUpdate(dietId, req.body, { new: true, runValidators: true });

    res.json({ message: 'Diet plan updated successfully', diet: updatedDiet })
})

const deleteDiet = asyncHandler(async (req, res) => {
    const dietId = req.params.id
    const diet = await Diet.findById(dietId)

    if (!diet) { res.status(404); throw new Error('Diet plan not found') }

    const nutritionistProfile = await Nutritionist.findOne({ user: req.user.id }).select('_id');
    if (!nutritionistProfile || diet.nutritionistId.toString() !== nutritionistProfile._id.toString()) {
        res.status(403); throw new Error('Not authorized to delete this diet plan')
    }

    await diet.deleteOne()
    res.json({ message: 'Diet plan deleted successfully', Id: dietId })
})

const getDiets = asyncHandler(async (req, res) => {
    let query = {};

    if (req.user.role === 'nutritionist') {
        const nutritionistProfile = await Nutritionist.findOne({ user: req.user.id }).select('_id');
        if (!nutritionistProfile)
            return res.status(404).json({ success: false, message: "Nutritionist profile not found." });
        query.nutritionistId = nutritionistProfile._id;
    }

    if (req.user.role === 'customer') {
        const customerProfile = await Customer.findOne({ user: req.user.id }).select('_id');
        if (!customerProfile)
            return res.status(404).json({ success: false, message: "Customer profile not found." });
        query.customerId = customerProfile._id;
    }

    const diets = await Diet.find(query)
        .populate({ path: 'nutritionistId', populate: { path: 'user', select: 'username email' } })
        .populate({ path: 'customerId',     populate: { path: 'user', select: 'username email' } });

    if (diets.length === 0) {
        return res.status(200).json({
            success: true, count: 0, diets: [],
            message: req.user.role === 'nutritionist'
                ? "You haven't created any diet plans for clients yet."
                : "You don't have any diet plans yet. Start by booking a nutritionist!"
        });
    }

    const formatedDiets = diets.map(diet => {
        const { meals, ...dietObj } = diet.toObject();
        return {
            _id: dietObj._id,
            status: dietObj.status,
            mealCount: meals ? meals.length : 0,
            progress: dietObj.progress !== undefined ? `${dietObj.progress}%` : '0%',
            ...dietObj,
            meals: meals || []
        };
    });

    res.json({ count: formatedDiets.length, diets: formatedDiets })
})

// ─────────────────────────────────────────────────────────────────────────────
// MEALS
// ─────────────────────────────────────────────────────────────────────────────

const addMealToDiet = asyncHandler(async (req, res) => {
    const dietId = req.params.id;
    const { name, date } = req.body;

    const diet = await Diet.findById(dietId);
    if (!diet) { res.status(404); throw new Error('Diet plan not found') }

    const nutritionistProfile = await Nutritionist.findOne({ user: req.user.id }).select('_id');
    if (!nutritionistProfile || diet.nutritionistId.toString() !== nutritionistProfile._id.toString()) {
        res.status(403); throw new Error('Not authorized to modify meals in this diet plan')
    }

    const mealDate = new Date(date);
    if (mealDate < diet.startDate || mealDate > diet.endDate) {
        res.status(400); throw new Error('Meal date must be within the diet plan duration')
    }

    const isDuplicate = diet.meals.some(
        (meal) => meal.name === name && meal.date.toISOString() === new Date(date).toISOString()
    );
    if (isDuplicate) { res.status(400); throw new Error('This meal is already scheduled for this date') }

    diet.meals.push(req.body);
    const progressPercentage = await recalcProgress(diet);

    res.json({
        message: "Meal added successfully",
        meal: diet.meals[diet.meals.length - 1],
        mealCount: diet.meals.length,
        progress: `${diet.progress}%`,
        dietStatus: diet.status,
    });
});

const removeMealFromDiet = asyncHandler(async (req, res) => {
    const { id: dietId, mealId } = req.params

    const diet = await Diet.findById(dietId)
    if (!diet) { res.status(404); throw new Error('Diet plan not found') }

    const nutritionistProfile = await Nutritionist.findOne({ user: req.user.id }).select('_id');
    if (!nutritionistProfile || diet.nutritionistId.toString() !== nutritionistProfile._id.toString()) {
        res.status(403); throw new Error('Not authorized to remove meals in this diet plan')
    }

    const meal = diet.meals.id(mealId)
    if (!meal) { res.status(404); throw new Error('Meal not found') }

    meal.deleteOne()
    await recalcProgress(diet);

    res.json({
        message: 'Meal removed successfully',
        progress: `${diet.progress}%`,
        dietStatus: diet.status,
        mealCount: diet.meals.length
    })
})

const updateMealInDiet = asyncHandler(async (req, res) => {
    if (Object.keys(req.body).length === 0)
        return res.status(400).json({ message: "No update data provided" });

    const { dietId, mealId } = req.params;

    const diet = await Diet.findById(dietId);
    if (!diet) { res.status(404); throw new Error('Diet plan not found') }

    const nutritionistProfile = await Nutritionist.findOne({ user: req.user.id }).select('_id');
    if (!nutritionistProfile || diet.nutritionistId.toString() !== nutritionistProfile._id.toString()) {
        res.status(403); throw new Error('Not authorized to update meals in this diet plan')
    }

    const meal = diet.meals.id(mealId);
    if (!meal) { res.status(404); throw new Error('Meal not found') }

    Object.assign(meal, req.body);
    await recalcProgress(diet);

    res.json({
        message: 'Meal updated successfully',
        meal,
        progress: `${diet.progress}%`,
        dietStatus: diet.status
    });
});

const markMealAsDone = asyncHandler(async (req, res) => {
    const { dietId, mealId } = req.params

    const customerProfile = await Customer.findOne({ user: req.user.id }).select('_id');
    if (!customerProfile) { res.status(404); throw new Error('Customer profile not found') }

    const diet = await Diet.findOne({ _id: dietId, customerId: customerProfile._id })
    if (!diet) { res.status(404); throw new Error('Diet plan not found or unauthorized') }

    const meal = diet.meals.id(mealId)
    if (!meal) { res.status(404); throw new Error('Meal not found') }

    meal.isCompleted = !meal.isCompleted

    const progressPercentage = await recalcProgress(diet);

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayMeals = diet.meals.filter(m => {
        const mealDate = new Date(m.date); mealDate.setUTCHours(0, 0, 0, 0);
        return mealDate.getTime() === today.getTime()
    })
    const allTodayDone = todayMeals.length > 0 && todayMeals.every(m => m.isCompleted)

    res.json({
        message: `Meal marked as ${meal.isCompleted ? 'completed' : 'incomplete'}`,
        meal,
        progress: `${progressPercentage}%`,
        dietStatus: diet.status,
        mealsLogged: allTodayDone
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISES  ← NEW
// ─────────────────────────────────────────────────────────────────────────────

/** POST /plan/:id/exercises */
const addExerciseToDiet = asyncHandler(async (req, res) => {
    const dietId = req.params.id;

    const diet = await Diet.findById(dietId);
    if (!diet) { res.status(404); throw new Error('Diet plan not found') }

    const nutritionistProfile = await Nutritionist.findOne({ user: req.user.id }).select('_id');
    if (!nutritionistProfile || diet.nutritionistId.toString() !== nutritionistProfile._id.toString()) {
        res.status(403); throw new Error('Not authorized to modify this diet plan')
    }

    diet.exercises.push(req.body);
    await diet.save();

    res.status(201).json({
        message: 'Exercise added successfully',
        exercise: diet.exercises[diet.exercises.length - 1],
        exerciseCount: diet.exercises.length
    });
});

/** PATCH /plan/:dietId/exercises/:exerciseId */
const updateExerciseInDiet = asyncHandler(async (req, res) => {
    if (Object.keys(req.body).length === 0)
        return res.status(400).json({ message: "No update data provided" });

    const { dietId, exerciseId } = req.params;

    const diet = await Diet.findById(dietId);
    if (!diet) { res.status(404); throw new Error('Diet plan not found') }

    const nutritionistProfile = await Nutritionist.findOne({ user: req.user.id }).select('_id');
    if (!nutritionistProfile || diet.nutritionistId.toString() !== nutritionistProfile._id.toString()) {
        res.status(403); throw new Error('Not authorized to update exercises in this diet plan')
    }

    const exercise = diet.exercises.id(exerciseId);
    if (!exercise) { res.status(404); throw new Error('Exercise not found') }

    Object.assign(exercise, req.body);
    await diet.save();

    res.json({ message: 'Exercise updated successfully', exercise });
});

/** DELETE /plan/:id/exercises/:exerciseId */
const removeExerciseFromDiet = asyncHandler(async (req, res) => {
    const { id: dietId, exerciseId } = req.params;

    const diet = await Diet.findById(dietId);
    if (!diet) { res.status(404); throw new Error('Diet plan not found') }

    const nutritionistProfile = await Nutritionist.findOne({ user: req.user.id }).select('_id');
    if (!nutritionistProfile || diet.nutritionistId.toString() !== nutritionistProfile._id.toString()) {
        res.status(403); throw new Error('Not authorized to remove exercises from this diet plan')
    }

    const exercise = diet.exercises.id(exerciseId);
    if (!exercise) { res.status(404); throw new Error('Exercise not found') }

    exercise.deleteOne();
    await diet.save();

    res.json({
        message: 'Exercise removed successfully',
        exerciseCount: diet.exercises.length
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// NUTRITIONIST CUSTOMER LIST
// ─────────────────────────────────────────────────────────────────────────────

const getNutritionistCustomers = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Appointments store the nutritionist's User ID in nutritionistId
    const appointments = await Appointment.find({
        nutritionistId: userId,
        customerId: { $ne: null }
    });

    const customerUserIds = [...new Set(appointments.map(app => app.customerId.toString()))];

    // Find Customer profiles where the user field matches those User IDs
    const customersList = await Customer.find({
        user: { $in: customerUserIds }
    }).populate('user', 'username email profilePic');

    // For each customer, attach their active/latest diet plan summary
    const customersWithDiets = await Promise.all(customersList.map(async (customer) => {
        const existingDiet = await Diet.findOne({ customerId: customer._id })
            .sort({ createdAt: -1 })
            .select('_id status progress startDate endDate');

        return {
            ...customer.toObject(),
            existingDiet: existingDiet || null
        };
    }));

    res.json(customersWithDiets);
});

// ─────────────────────────────────────────────────────────────────────────────
// NUTRITIONIST CLIENT-PEEK DASHBOARD  ← NEW
// GET /plan/client-peek/:clientUserId?days=30
// Returns everything the customer dashboard shows, but fetched by the nutritionist.
// ─────────────────────────────────────────────────────────────────────────────

const getClientDashboardPeek = asyncHandler(async (req, res) => {
    const nutritionistUserId = req.user.id;
    const clientUserId = req.params.clientUserId;
    const days = parseInt(req.query.days) || 30;

    // 1. Verify this nutritionist actually has an appointment with this client
    const hasRelationship = await Appointment.findOne({
        nutritionistId: nutritionistUserId,
        customerId: clientUserId
    });
    if (!hasRelationship) {
        res.status(403);
        throw new Error('You do not have an appointment relationship with this client.');
    }

    // 2. Fetch the customer profile
    const profile = await Customer.findOne({ user: clientUserId })
        .select('age gender height currentWeight targetWeight startingWeight goals allergies primaryGoal')
        .populate('user', 'username email profilePic');

    if (!profile) {
        res.status(404);
        throw new Error('Customer profile not found.');
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 3. Fetch today's log
    const todayLog = await DailyLog.findOne({ user: clientUserId, date: today });

    // 4. Fetch active diet plan
    const activeDiet = await Diet.findOne({
        customerId: profile._id,
        status: { $in: ['in progress', 'pending'] }
    })
        .sort({ createdAt: -1 })
        .select('_id status progress startDate endDate meals');

    // 5. Fetch log history
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    from.setDate(from.getDate() - days);

    const logs = await DailyLog.find({
        user: clientUserId,
        date: { $gte: from }
    }).sort({ date: 1 });

    // 6. Goals summary
    const goals = profile.goals || [];
    const goalsSummary = {
        total: goals.length,
        done: goals.filter(g => g.status === 'done').length,
        pending: goals.filter(g => g.status === 'pending').length,
        list: goals
    };

    // 7. Weight progress
    const [firstLog, latestLog] = await Promise.all([
        DailyLog.findOne({ user: clientUserId, weight: { $exists: true, $ne: null } })
            .sort({ date: 1 }).select('weight'),
        DailyLog.findOne({ user: clientUserId, weight: { $exists: true, $ne: null } })
            .sort({ date: -1 }).select('weight'),
    ]);

    const currentWeight = latestLog?.weight || profile.currentWeight;
    const originalWeight = firstLog?.weight || profile.currentWeight;
    const weightProgress = currentWeight && profile.targetWeight
        ? {
            current: currentWeight,
            target: profile.targetWeight,
            remaining: parseFloat((currentWeight - profile.targetWeight).toFixed(1)),
            original: originalWeight
        }
        : null;

    // 8. Today's meals from active diet
    const todayMeals = activeDiet
        ? activeDiet.meals.filter(m => {
            const mealDate = new Date(m.date);
            mealDate.setUTCHours(0, 0, 0, 0);
            return mealDate.getTime() === today.getTime();
        })
        : [];

    res.json({
        success: true,
        summary: {
            profile,
            todayLog: todayLog || { waterIntake: 0, exerciseMinutes: 0, weight: null, mealsLogged: false },
            activeDiet: activeDiet
                ? { _id: activeDiet._id, status: activeDiet.status, progress: activeDiet.progress, startDate: activeDiet.startDate, endDate: activeDiet.endDate }
                : null,
            todayMeals,
            weightProgress,
            goalsSummary,
        },
        goals: goals,
        logs,
        activeDiet: activeDiet || null,
        todayLog: todayLog || null,
        appointments: [] // Nutritionist already has appointment context; can be extended later
    });
});

module.exports = {
    createDiet,
    updateDiet,
    deleteDiet,
    getDiets,
    markMealAsDone,
    addMealToDiet,
    removeMealFromDiet,
    updateMealInDiet,
    addExerciseToDiet,
    updateExerciseInDiet,
    removeExerciseFromDiet,
    getNutritionistCustomers,
    getClientDashboardPeek  // ← NEW
}