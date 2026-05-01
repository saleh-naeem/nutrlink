const asyncHandler = require('express-async-handler')
const Appointment = require('../model/Appointment')
const Nutritionist = require('../model/Nutritionist')

const createSlot = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { date, timeSlot } = req.body

  const profile = await Nutritionist.findOne({ user: userId })

  if (!profile) {
    res.status(403)
    throw new Error('Nutritionist profile required before creating time slots.')
  }

  const nutritionistId = userId

  const slotExists = await Appointment.findOne({ nutritionistId, date, timeSlot })

  if (slotExists) {
    res.status(400)
    throw new Error('This time slot already exists for this date.')
  }

  const newSlot = await Appointment.create({
    nutritionistId,
    date,
    timeSlot,
    status: 'available'
  });

  res.status(201).json({
    message: 'Available time slot created successfully',
    slot: newSlot
  })
})

const deleteSlot = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const appointmentId = req.params.id

  const appointment = await Appointment.findById(appointmentId)

  if (!appointment) {
    res.status(404)
    throw new Error('Appointment not found')
  }

  if (appointment.nutritionistId.toString() !== userId) {
    res.status(401)
    throw new Error('No authorized to delete this slot')
  }
  if (appointment.status === 'booked') {
    res.status(400)
    throw new Error('Cannot delete a booked slot. Cancel it first.')
  }

  await appointment.deleteOne()

  res.json({ message: 'Slot deleted successfully' })
})

const getAvailableSlots = asyncHandler(async (req, res) => {
  const { nutritionistId } = req.params

  const slots = await Appointment.find({ nutritionistId: nutritionistId, status: 'available' })
    .populate({
      path: 'nutritionistId',
      populate: ('nutritionistId', 'username email profilePic')
    }).sort({ date: 1, timeSlot: 1 })

  res.json({
    message: 'Available slot fetched successfully',
    count: slots.length,
    slots
  })
})

const bookAppointment = asyncHandler(async (req, res) => {
  const customerId = req.user.id
  const appointmentId = req.params.id

  const book = await Appointment.findById(appointmentId)

  if (!book) {
    res.status(404)
    throw new Error('Appointment not found')
  }

  if (book.status !== 'available') {
    res.status(400)
    throw new Error('This time slot is no longer available')
  }

  book.customerId = customerId
  book.status = 'booked'
  await book.save()
  res.json({ message: 'done' })
})

const getCustomerAppointments = asyncHandler(async (req, res) => {
  const customerId = req.user.id

  const appointments = await Appointment.find({ customerId })
    .populate('nutritionistId', 'username email profilePic') // Just get the user details directly
    .sort({ date: 1, timeSlot: 1 });

  if (appointments.length === 0) {
    return res.json({
      message: "you haven't booked any appointments yet.",
      count: 0,
      appointments: []
    })
  }
  res.json({
    message: 'Customer appointments fetched successfully',
    count: appointments.length,
    appointments
  })
})

const getNutritionistSchedule = asyncHandler(async (req, res) => {
  const nutritionistId = req.user.id

  const schedule = await Appointment.find({ nutritionistId })
    .populate('customerId', 'username email profilePic')
    .sort({ date: 1, timeSlot: 1 })


  res.json({
    message: "Nutritionist data fetched",
    count: schedule.length,
    schedule
  })
})

const cancelAppointment = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const appointmentId = req.params.id

  const appointment = await Appointment.findById(appointmentId)

  if (!appointment) {
    res.status(404)
    throw new Error('appointment not found')
  }

  const isCustomer = appointment.customerId && appointment.customerId.toString() === userId;
  const isNutritionist = appointment.nutritionistId.toString() === userId;

  if (!isCustomer && !isNutritionist) {
    res.status(401);
    throw new Error('Not authorized to cancel this appointment');
  }

  appointment.status = 'canceled'
  await appointment.save()

  res.json({ message: 'Appointment cancelled successfully' })

})

const markCompleted = asyncHandler(async (req, res) => {
  const appointmentId = req.params.id
  const nutritionistId = req.user.id
  const appointment = await Appointment.findById(appointmentId)

  if (!appointment) {
    res.status(404)
    throw new Error('Appointment not found')
  }

  if (appointment.nutritionistId.toString() !== nutritionistId) {
    res.status(401)
    throw new Error('Not authorized to modify this slot')
  }

  // The Toggle Logic
  if (appointment.status === 'booked') {
    appointment.status = 'completed';

    // Add 1 to clientServed
    await Nutritionist.findOneAndUpdate({ user: nutritionistId }, { $inc: { clientServed: 1 } });

  } else if (appointment.status === 'completed') {
    appointment.status = 'booked';

    // Subtract 1 from clientServed (Undo)
    const updatedProfile = await Nutritionist.findOneAndUpdate(
      { user: nutritionistId },
      { $inc: { clientServed: -1 } },
      { new: true }
    );

    console.log("Database Result:", updatedProfile);
  } else {
    res.status(400);
    throw new Error('Can only toggle appointments that are either booked or completed.');
  }

  await appointment.save()

  res.json({
    message: `Appointment successfully changed to ${appointment.status}`,
    currentStatus: appointment.status
  })
})

const rescheduleAppointment = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { currentSlotId, newSlotId } = req.body

  const currentSlot = await Appointment.findById(currentSlotId)
  const newSlot = await Appointment.findById(newSlotId)

  if (!currentSlot || !newSlot) {
    res.status(404)
    throw new Error('Appointment slot not found')
  }

  if (currentSlot.customerId?.toString() !== userId) {
    res.status(401)
    throw new Error('Not authorized to reschedule this appointment')
  }

  if (newSlot.status !== 'available') {
    res.status(400)
    throw new Error('The new time slot is no longer available')
  }

  currentSlot.customerId = undefined
  currentSlot.status = 'available'
  await currentSlot.save()

  newSlot.customerId = userId
  newSlot.status = 'booked'
  await newSlot.save()

  res.json({ message: 'Appointment rescheduled successfully' })
})

const getAllAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({})
    .populate('nutritionistId', 'username email')
    .populate('customerId', 'username email')
    .sort({ date: -1, timeSlot: -1 });

  res.json({
    message: 'All system appointments fetched successfully',
    count: appointments.length,
    appointments
  });
});

module.exports = {
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
}