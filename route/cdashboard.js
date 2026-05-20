const express = require('express');
const router = express.Router();
const authToken = require('../middleware/verifyToken');
const nutriValidation = require('../middleware/nutriValidation');
const DailyLog = require('../model/Progress');
const Customer = require('../model/Customer');
const Appointment = require('../model/Appointment');

router.use(authToken);

// ─────────────────────────────────────────────────────────────────────────────
//  GET /cdashboard/client-peek/:clientId?days=30
//
//  Nutritionist reads a client's charts + sidebar stats.
//  clientId = the client's USER _id (frontend passes selected.userId)
//  Security: verifies an appointment exists between nutritionist and client.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/client-peek/:clientId', nutriValidation, async (req, res) => {
    try {
        const nutritionistUserId = req.user.id;
        const clientUserId = req.params.clientId;
        const days = parseInt(req.query.days) || 30;

        // 1. Verify relationship
        const hasRelationship = await Appointment.findOne({
            nutritionistId: nutritionistUserId,
            customerId: clientUserId,
        });

        if (!hasRelationship) {
            return res.status(403).json({
                success: false,
                message: 'You do not have an appointment with this client.',
            });
        }

        // 2. Dates
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const from = new Date();
        from.setUTCHours(0, 0, 0, 0);
        from.setDate(from.getDate() - days);

        // 3. Get same data as customer dashboard summary
        const [profile, logs, todayLog, firstLog, latestLog] = await Promise.all([
            Customer.findOne({ user: clientUserId })
                .select('age gender height currentWeight targetWeight startingWeight goals allergies primaryGoal')
                .populate('user', 'username email profilePic'),

            DailyLog.find({
                user: clientUserId,
                date: { $gte: from },
            })
                .sort({ date: 1 })
                .select('date weight waterIntake exerciseMinutes'),

            DailyLog.findOne({
                user: clientUserId,
                date: today,
            }).select('date weight waterIntake exerciseMinutes'),

            DailyLog.findOne({
                user: clientUserId,
                weight: { $exists: true, $ne: null },
            })
                .sort({ date: 1 })
                .select('weight'),

            DailyLog.findOne({
                user: clientUserId,
                weight: { $exists: true, $ne: null },
            })
                .sort({ date: -1 })
                .select('weight'),
        ]);

        // 4. Use latest logged weight, not only profile currentWeight
        const currentWeight = latestLog?.weight || profile?.currentWeight;
        const originalWeight = firstLog?.weight || profile?.startingWeight || profile?.currentWeight;

        const weightProgress =
            currentWeight && profile?.targetWeight
                ? {
                    current: currentWeight,
                    target: profile.targetWeight,
                    remaining: parseFloat((currentWeight - profile.targetWeight).toFixed(1)),
                    original: originalWeight,
                }
                : null;

        const goalsSummary = profile
            ? {
                total: profile.goals?.length || 0,
                done: profile.goals?.filter(g => g.status === "done").length || 0,
                pending: profile.goals?.filter(g => g.status === "pending").length || 0,
            }
            : null;

        res.status(200).json({
            success: true,
            logs,
            summary: {
                profile: profile || null,
                todayLog: todayLog || {
                    waterIntake: 0,
                    exerciseMinutes: 0,
                    weight: currentWeight || null,
                    mealsLogged: false,
                },
                weightProgress,
                goalsSummary,
            },
            todayLog: todayLog || {
                waterIntake: 0,
                exerciseMinutes: 0,
                weight: currentWeight || null,
                mealsLogged: false,
            },
            goals: profile?.goals || [],
            activeDiet: null,
            appointments: [],
        });

    } catch (err) {
        console.error('[client-peek]', err);
        res.status(500).json({
            success: false,
            message: 'Server error.',
            error: err.message,
        });
    }
});

module.exports = router;