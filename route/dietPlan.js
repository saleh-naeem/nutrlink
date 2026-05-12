const express = require('express')
const router = express.Router()
const authToken = require('../middleware/verifyToken')
const cusValidation = require('../middleware/cusValidation')
const nutriValidation = require('../middleware/nutriValidation')
const {
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
} = require('../controller/dietPlanController')

router.use(authToken)

// ─────────────────────────────────────────────────────────────────────────────
// NUTRITIONIST SPECIAL ROUTES
// Must be defined BEFORE /:id routes to avoid route collision
// ─────────────────────────────────────────────────────────────────────────────

// GET /plan/my-customers — list of clients with their diet plan summary
router.get('/my-customers', nutriValidation, getNutritionistCustomers);

// GET /plan/client-peek/:clientUserId?days=30 — read a client's full dashboard data
// NOTE: This is also registered in app.js under /nutrlink/api/dashboard/client-peek/:clientId
// Keeping it here too so it's co-located with the diet plan logic.
router.get('/client-peek/:clientUserId', nutriValidation, getClientDashboardPeek);

// ─────────────────────────────────────────────────────────────────────────────
// DIET PLAN CRUD
// ─────────────────────────────────────────────────────────────────────────────

router.route('/')
    .get(getDiets)                      // Both roles
    .post(nutriValidation, createDiet); // Nutritionist only

router.route('/:id')
    .put(nutriValidation, updateDiet)       // Nutritionist only
    .delete(nutriValidation, deleteDiet);   // Nutritionist only

// ─────────────────────────────────────────────────────────────────────────────
// MEALS
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/meals', nutriValidation, addMealToDiet);
router.delete('/:id/meals/:mealId', nutriValidation, removeMealFromDiet);

// Customer toggles meal completion
router.patch('/:dietId/meals/:mealId/status', cusValidation, markMealAsDone);

// Nutritionist edits meal details (must be BELOW the /status route)
router.patch('/:dietId/meals/:mealId', nutriValidation, updateMealInDiet);

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISES  ← NEW
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/exercises', nutriValidation, addExerciseToDiet);
router.patch('/:dietId/exercises/:exerciseId', nutriValidation, updateExerciseInDiet);
router.delete('/:id/exercises/:exerciseId', nutriValidation, removeExerciseFromDiet);

module.exports = router