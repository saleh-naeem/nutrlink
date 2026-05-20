const express = require('express')
const router = express.Router()
const authToken = require('../middleware/verifyToken')
const isadmin = require('../middleware/isadmin')
const cusValidation = require('../middleware/cusValidation')
const nutriValidation = require('../middleware/nutriValidation')
const { 
    createSlot, 
    deleteSlot,
    getAvailableSlots, 
    bookAppointment, 
    getCustomerAppointments,
    getNutritionistSchedule,
    cancelAppointment,
    markCompleted,
    rescheduleAppointment,
    getAllAppointments,
    cleanupPastAppointments
} = require('../controller/appointmentController');


// NUTRITIONIST ROUTES
router.post('/slot', authToken, nutriValidation, createSlot)
router.delete('/slot/:id', authToken, nutriValidation, deleteSlot)
router.get('/schedule', authToken, nutriValidation, getNutritionistSchedule)
router.put('/complete/:id', authToken, nutriValidation, markCompleted)


// CUSTOMER ROUTES
router.put('/book/:id', authToken, cusValidation, bookAppointment);
router.get('/customer-appointments', authToken, cusValidation, getCustomerAppointments);
router.put('/reschedule', authToken, cusValidation, rescheduleAppointment);


// SHARED ROUTES (Customer & Nutritionist - Just need to be logged in)
router.put('/cancel/:id', authToken, cancelAppointment);


// PUBLIC ROUTE (Anyone can view available slots)
router.get('/:nutritionistId', getAvailableSlots)


// ADMIN ROUTE
router.get('/admin/all', authToken, isadmin, getAllAppointments);


module.exports = router;