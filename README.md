# NutriLink Backend API 🚀

The complete backend REST API for the NutriLink platform - a comprehensive nutrition and wellness application connecting clients with certified nutritionists through personalized consultations, AI-powered guidance, and progress tracking.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.18+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1-orange)
## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Models](#database-models)
- [Authentication & Authorization](#authentication--authorization)
- [Middleware](#middleware)
- [Error Handling](#error-handling)

## Architecture Overview

NutriLink Backend follows a **RESTful API architecture** with:
- **MVC Pattern**: Controllers handle business logic, models define data schemas
- **Middleware Chain**: Authentication, validation, error handling
- **JWT Authentication**: Stateless authentication with role-based access control
- **Cloud Storage**: Cloudinary for image hosting (credentials, profile pictures)
- **AI Integration**: OpenAI GPT-4.1-mini for intelligent nutrition guidance

### System Flow
```
Client Request
    ↓
Express Router
    ↓
Authentication Middleware (JWT)
    ↓
Role Validation Middleware
    ↓
Controller (Business Logic)
    ↓
MongoDB (Mongoose ODM)
    ↓
Response (JSON)
```

## 🛠 Tech Stack

### Core
- **Node.js** (v18+): JavaScript runtime
- **Express.js** (v4.18+): Web framework
- **MongoDB Atlas**: Cloud database
- **Mongoose**: ODM for MongoDB

### Authentication & Security
- **jsonwebtoken**: JWT token generation and validation
- **bcryptjs**: Password hashing
- **Google OAuth**: Third-party authentication
- **cors**: Cross-Origin Resource Sharing

### File Upload & Storage
- **Multer**: Multipart form-data handling
- **Cloudinary**: Cloud image storage and optimization

### AI & External Services
- **OpenAI API**: GPT-4.1-mini for nutrition chatbot

### Utilities
- **dotenv**: Environment variable management
- **express-async-handler**: Async error handling wrapper

## ✨ Features

### 🔐 Authentication System
- Email/password registration with bcrypt hashing
- JWT-based stateless authentication
- Google OAuth 2.0 integration
- Role-based access control (Customer, Nutritionist, Admin)
- Admin approval workflow for nutritionists
- Credential image upload and verification

### 👥 User Management
- **Customer Profiles**: Health metrics, goals, allergies, weight tracking
- **Nutritionist Profiles**: Specializations, experience, bio, pricing, languages
- **Admin Panel**: User approval, credential verification, platform oversight

### 📅 Appointment System
- **Slot Management**: Nutritionists create availability slots
- **Booking**: Customers book consultations
- **Status Tracking**: pending → booked → completed/cancelled
- **History**: View past appointments
- **Rescheduling**: Modify appointment times

### 🥗 Diet Plan Management
- **Custom Plans**: Nutritionists create personalized meal plans
- **Meal Tracking**: Customers mark meals as completed
- **Progress Monitoring**: Track plan completion percentage
- **CRUD Operations**: Full meal and plan management

### 🤖 AI Nutrition Assistant
- **Context-Aware Chat**: Uses customer profile data (age, weight, goals, allergies)
- **Conversation Memory**: Maintains chat history (last 8 messages)
- **Nutrition-Focused**: Only answers diet and health-related questions
- **Multi-Chat Support**: Create and manage multiple conversation threads
- **Markdown Responses**: Rich formatted replies

### 📊 Progress Tracking
- **Daily Logs**: Water intake, exercise minutes, weight
- **Historical Data**: View logs by day, week, or month
- **Weight Journey**: Track progress from start to target
- **Visual Summaries**: Dashboard with charts and stats

### 📈 Analytics Dashboard
- **Nutritionist Stats**: Total clients, appointments, earnings
- **Chart Data**: Revenue trends, appointment distribution
- **Performance Metrics**: Completion rates, cancellation rates

### 🧮 Calorie Calculator
- **BMR Calculation**: Gender-specific Mifflin-St Jeor equation
- **TDEE**: Total daily energy expenditure with activity factors
- **Goal-Based Targets**: Weight loss, maintenance, muscle gain
- **Activity Levels**: 6 levels from sedentary to athlete

## 📁 Project Structure

```
nutrilink-backend/
├── config/
│   └── db.js                 # MongoDB connection
│
├── controller/
│   ├── authController.js     # Register, login, OAuth
│   ├── customerController.js # Profile, goals management
│   ├── nutritionistController.js # Professional profiles
│   ├── appointmentController.js  # Slot & booking logic
│   ├── dietPlanController.js     # Meal plan CRUD
│   ├── dashboardController.js    # Stats & analytics
│   └── calculatorController.js   # BMR/TDEE calculations
│
├── middleware/
│   ├── verifyToken.js        # JWT authentication
│   ├── isadmin.js            # Admin-only access
│   ├── cusValidation.js      # Customer role validation
│   ├── nutriValidation.js    # Nutritionist role validation
│   └── errorMiddleware.js    # Error handling
│
├── model/
│   ├── User.js               # User accounts (auth)
│   ├── Customer.js           # Customer health profiles
│   ├── Nutritionist.js       # Nutritionist profiles
│   ├── Appointment.js        # Appointment bookings
│   ├── DietPlan.js           # Meal plans
│   ├── Ai.js                 # Chat conversations
│   ├── Progress.js           # Daily logs
│   └── Goal.js               # Customer goals
│
├── route/
│   ├── auth.js               # Auth endpoints
│   ├── admin.js              # Admin operations
│   ├── customer.js           # Customer profile
│   ├── nutritionist.js       # Nutritionist profile
│   ├── appointment.js        # Appointment system
│   ├── dietPlan.js           # Diet plan routes
│   ├── ai.js                 # AI chatbot
│   ├── progress.js           # Progress tracking
│   ├── dashboard.js          # Analytics
│   ├── calculator.js         # Calorie calculator
│   └── goal.js               # Goal management
│
├── .env                      # Environment variables 
├── .gitignore                # Git ignore file
├── app.js                    # Express app setup
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** account (MongoDB Atlas recommended)
- **Cloudinary** account for image storage
- **OpenAI** API key for chatbot
- **Google Cloud** project with OAuth credentials 

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/saleh-naeem/nutrilink.git
   cd nutrilink
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGO_URI=your_mongodb_connection_string

   # JWT Authentication
   JWT_SECRET=your_super_secret_jwt_key_here

   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_SECRET_ID=your_google_client_secret

   # Cloudinary Image Storage
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # OpenAI API
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Start the development server**
   ```bash
   node app
   ```

5. **Verify the server is running**
   
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```
   
   You should see:
   ```json
   {
     "message": "NutriPlan API is running",
     "cloudinary": "✅ Configured"
   }
   ```

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

**Cloudinary:**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Navigate to Dashboard
3. Copy Cloud Name, API Key, and API Secret

**OpenAI API:**
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Navigate to API Keys section
3. Create a new secret key
4. Copy the key (you won't see it again!)

## 📚 API Documentation

### Base URL
```
http://localhost:5000/nutrlink/api
```

### Authentication Header
Most endpoints require JWT authentication:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 🔑 Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: multipart/form-data
```

**Request Body:**
```javascript
{
  email: "user@example.com",
  username: "JohnDoe",
  password: "SecurePass123!",
  role: "customer" | "nutritionist",
  credentialImage: File (required for nutritionists)
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "JohnDoe",
    "role": "customer",
    "isApproved": true
  }
}
```

**Note**: Nutritionists require admin approval before accessing protected features.

---

### Login User
```http
POST /auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "JohnDoe",
    "role": "customer"
  }
}
```

---

### Google OAuth Login
```http
POST /auth/google
Content-Type: application/json
```

**Request Body:**
```json
{
  "credential": "google_oauth_token",
  "role": "customer" | "nutritionist"
}
```

---

## 👤 Customer Profile Endpoints

### Create Customer Profile
```http
POST /customer/profile/
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "age": 28,
  "gender": "Male",
  "height": 175,
  "currentWeight": 85,
  "targetWeight": 75,
  "allergies": ["peanuts", "dairy"]
}
```

**Response (201):**
```json
{
  "_id": "profile_id",
  "user": "user_id",
  "age": 28,
  "gender": "Male",
  "height": 175,
  "currentWeight": 85,
  "targetWeight": 75,
  "allergies": ["peanuts", "dairy"],
  "goals": []
}
```

---

### Get Customer Profile
```http
GET /customer/profile/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "profile_id",
  "user": {
    "_id": "user_id",
    "username": "JohnDoe",
    "email": "john@example.com"
  },
  "age": 28,
  "gender": "Male",
  "height": 175,
  "currentWeight": 85,
  "targetWeight": 75,
  "allergies": ["peanuts"],
  "goals": [
    {
      "_id": "goal_id",
      "data": "Lose 10kg in 3 months",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Update Customer Profile
```http
PUT /customer/profile/me
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "age": 29,
  "currentWeight": 83,
  "allergies": ["peanuts", "dairy", "shellfish"]
}
```

---

## 🩺 Nutritionist Profile Endpoints

### Create Nutritionist Profile
```http
POST /nutritionist/profile/
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "specialization": ["Weight Loss", "Sports Nutrition"],
  "bio": "Certified nutritionist with 5+ years of experience...",
  "cardBio": "Expert in weight management and athletic performance",
  "yearsOfExperience": 5,
  "languages": ["English", "Arabic"],
  "price": 50
}
```

---

### Get Nutritionist Profile
```http
GET /nutritionist/profile/me
Authorization: Bearer <token>
```

---

### Update Nutritionist Profile
```http
PUT /nutritionist/profile/me
Authorization: Bearer <token>
```

---

### Get All Nutritionists (Public)
```http
GET /nutritionist/profile/all
```

**Response (200):**
```json
[
  {
    "_id": "nutritionist_id",
    "user": {
      "_id": "user_id",
      "username": "Dr. Sarah",
      "email": "sarah@example.com"
    },
    "specialization": ["Weight Loss", "Diabetic Diet"],
    "cardBio": "Certified nutritionist specializing in...",
    "yearsOfExperience": 8,
    "languages": ["English", "Spanish"],
    "price": 75,
    "rating": 4.8
  }
]
```

---

### Get Filtered Nutritionist Cards
```http
GET /nutritionist/cards/filter?specialization=Weight Loss&language=English
Authorization: Bearer <token>
```

---

## 👨‍💼 Admin Endpoints

### Get Pending Nutritionists
```http
GET /admin/pending
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
[
  {
    "_id": "user_id",
    "username": "Dr. Ahmed",
    "email": "ahmed@example.com",
    "role": "nutritionist",
    "isApproved": false,
    "credentialImage": "https://res.cloudinary.com/.../credential.jpg",
    "createdAt": "2024-03-15T08:00:00Z"
  }
]
```

---

### Approve Nutritionist
```http
PUT /admin/approve/:id
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "message": "Nutritionist approved successfully.",
  "user": {
    "_id": "user_id",
    "username": "Dr. Ahmed",
    "isApproved": true
  }
}
```

---

### Reject Nutritionist
```http
PUT /admin/reject/:id
Authorization: Bearer <admin_token>
```

---

## 📅 Appointment Endpoints

### Create Availability Slot (Nutritionist)
```http
POST /appointments/slot
Authorization: Bearer <nutritionist_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "date": "2024-03-20",
  "time": "14:00",
  "duration": 60
}
```

---

### Delete Slot (Nutritionist)
```http
DELETE /appointments/slot/:slotId
Authorization: Bearer <nutritionist_token>
```

---

### Get Available Slots (Public)
```http
GET /appointments/:nutritionistId
```

**Response (200):**
```json
{
  "slots": [
    {
      "_id": "slot_id",
      "date": "2024-03-20T00:00:00Z",
      "time": "14:00",
      "duration": 60,
      "status": "available"
    }
  ]
}
```

---

### Book Appointment (Customer)
```http
PUT /appointments/book/:slotId
Authorization: Bearer <customer_token>
```

---

### Get Customer Appointments
```http
GET /appointments/customer-appointments
Authorization: Bearer <customer_token>
```

---

### Get Nutritionist Schedule
```http
GET /appointments/schedule?status=booked
Authorization: Bearer <nutritionist_token>
```

**Query Parameters:**
- `status`: `pending` | `booked` | `completed` | `cancelled` (optional)

---

### Mark Appointment as Completed (Nutritionist)
```http
PUT /appointments/complete/:appointmentId
Authorization: Bearer <nutritionist_token>
```

---

### Cancel Appointment (Both Roles)
```http
PUT /appointments/cancel/:appointmentId
Authorization: Bearer <token>
```

---

### Reschedule Appointment (Customer)
```http
PUT /appointments/reschedule
Authorization: Bearer <customer_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "appointmentId": "appointment_id",
  "newDate": "2024-03-25",
  "newTime": "15:00"
}
```

---

## 🥗 Diet Plan Endpoints

### Create Diet Plan (Nutritionist)
```http
POST /plan/
Authorization: Bearer <nutritionist_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "customerId": "customer_id",
  "startDate": "2024-03-15",
  "endDate": "2024-04-15",
  "meals": [
    {
      "date": "2024-03-15",
      "type": "breakfast",
      "description": "Oatmeal with berries and nuts",
      "calories": 350,
      "protein": 12,
      "carbs": 55,
      "fats": 10
    }
  ]
}
```

---

### Get Diet Plans
```http
GET /plan/
Authorization: Bearer <token>
```

**Response** (Customer sees their plans, Nutritionist sees their created plans):
```json
[
  {
    "_id": "plan_id",
    "customerId": "customer_id",
    "nutritionistId": "nutritionist_id",
    "status": "in progress",
    "progress": 35,
    "startDate": "2024-03-15",
    "endDate": "2024-04-15",
    "meals": [...]
  }
]
```

---

### Update Diet Plan (Nutritionist)
```http
PUT /plan/:planId
Authorization: Bearer <nutritionist_token>
```

---

### Delete Diet Plan (Nutritionist)
```http
DELETE /plan/:planId
Authorization: Bearer <nutritionist_token>
```

---

### Add Meal to Diet Plan (Nutritionist)
```http
POST /plan/:planId/meals
Authorization: Bearer <nutritionist_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "date": "2024-03-16",
  "type": "lunch",
  "description": "Grilled chicken with quinoa",
  "calories": 450,
  "protein": 35,
  "carbs": 40,
  "fats": 15
}
```

---

### Mark Meal as Done (Customer)
```http
PATCH /plan/:dietId/meals/:mealId/status
Authorization: Bearer <customer_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "isDone": true
}
```

---

### Update Meal in Diet Plan (Nutritionist)
```http
PATCH /plan/:dietId/meals/:mealId
Authorization: Bearer <nutritionist_token>
```

---

### Remove Meal from Diet Plan (Nutritionist)
```http
DELETE /plan/:dietId/meals/:mealId
Authorization: Bearer <nutritionist_token>
```

---

## 🤖 AI Chat Endpoints

### Create New Chat
```http
POST /AI/chat
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Meal Planning Tips"
}
```

**Response (201):**
```json
{
  "_id": "chat_id",
  "title": "Meal Planning Tips",
  "user": "user_id",
  "context": {
    "age": 28,
    "gender": "Male",
    "weight": 85,
    "height": 175,
    "allergies": "peanuts",
    "goal": "Lose 10kg in 3 months"
  },
  "messages": [],
  "createdAt": "2024-03-20T10:00:00Z"
}
```

---

### Send Message
```http
POST /AI/:chatId
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "What should I eat for breakfast to lose weight?"
}
```

**Response (200):**
```json
{
  "reply": "Based on your profile (85kg, goal: weight loss), here are some breakfast suggestions:\n\n**High-Protein Options:**\n- Greek yogurt with berries\n- Egg white omelet with vegetables\n- Protein smoothie with banana\n\nThese meals will keep you full and support your weight loss goal."
}
```

**AI Behavior:**
- Only answers nutrition-related questions
- Uses customer profile context (age, weight, goals, allergies)
- Maintains last 8 messages for context
- Responds in Markdown format
- Refuses non-nutrition questions with: "I am a nutrition assistant and I can only answer questions related to nutrition and health."

---

### Get All Chats
```http
GET /AI/chat
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "chat_id_1",
    "title": "Meal Planning Tips"
  },
  {
    "_id": "chat_id_2",
    "title": "Workout Nutrition"
  }
]
```

---

### Get Chat Messages
```http
GET /AI/messages/:chatId
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "role": "user",
    "content": "What should I eat for breakfast?",
    "timestamp": "2024-03-20T10:05:00Z"
  },
  {
    "role": "assistant",
    "content": "Based on your profile...",
    "timestamp": "2024-03-20T10:05:02Z"
  }
]
```

---

### Delete Chat
```http
DELETE /AI/chat/:chatId
Authorization: Bearer <token>
```

---

## 📊 Progress Tracking Endpoints

### Log Daily Progress
```http
POST /progress/log
Authorization: Bearer <customer_token>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "waterIntake": 2500,
  "exerciseMinutes": 45,
  "weight": 83.5
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Daily log saved.",
  "log": {
    "_id": "log_id",
    "user": "user_id",
    "date": "2024-03-20T00:00:00Z",
    "waterIntake": 2500,
    "exerciseMinutes": 45,
    "weight": 83.5,
    "mealsLogged": false
  }
}
```

---

### Get Today's Log
```http
GET /progress/log/today
Authorization: Bearer <customer_token>
```

---

### Get Log History
```http
GET /progress/log/history?days=30
GET /progress/log/history?period=monthly
Authorization: Bearer <customer_token>
```

**Query Parameters:**
- `days`: Number of days to retrieve (default: 30)
- `period`: `monthly` for month-end snapshots (returns 12 months)

**Response (200) - Daily:**
```json
{
  "success": true,
  "logs": [
    {
      "_id": "log_id",
      "date": "2024-03-20",
      "waterIntake": 2500,
      "exerciseMinutes": 45,
      "weight": 83.5
    }
  ]
}
```

---

### Get Weekly Log
```http
GET /progress/log/weekly
Authorization: Bearer <customer_token>
```

Returns week-end snapshots for the past 12 weeks.

---

### Get Progress Summary
```http
GET /progress/summary
Authorization: Bearer <customer_token>
```

**Response (200):**
```json
{
  "success": true,
  "summary": {
    "profile": {
      "user": { "username": "JohnDoe", "email": "john@example.com" },
      "age": 28,
      "currentWeight": 83,
      "targetWeight": 75,
      "allergies": ["peanuts"]
    },
    "todayLog": {
      "waterIntake": 2500,
      "exerciseMinutes": 45,
      "weight": 83.5
    },
    "activeDiet": {
      "_id": "diet_id",
      "status": "in progress",
      "progress": 65
    },
    "todayMeals": [...],
    "weightProgress": {
      "current": 83.5,
      "target": 75,
      "remaining": 8.5,
      "original": 85
    },
    "goalsSummary": {
      "total": 3,
      "done": 1,
      "pending": 2
    },
    "nextAppointment": {
      "date": "2024-03-25",
      "nutritionist": { "username": "Dr. Sarah" }
    }
  }
}
```

---

## 🎯 Goal Endpoints

### Create Goal
```http
POST /customer/goal/
Authorization: Bearer <customer_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "data": "Lose 10kg in 3 months"
}
```

---

### Mark Goal as Done
```http
PUT /customer/goal/
Authorization: Bearer <customer_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "goalId": "goal_id"
}
```

---

### Delete Goal
```http
DELETE /customer/goal/:goalId
Authorization: Bearer <customer_token>
```

---

### Get All Goals
```http
GET /customer/goal/
Authorization: Bearer <customer_token>
```

---

## 🧮 Calculator Endpoints

### Get Activity Options
```http
GET /calculator/activity-options
```

**Response (200):**
```json
{
  "activityOptions": [
    {
      "label": "Sedentary",
      "description": "Little or no exercise",
      "value": 1.2
    },
    {
      "label": "Lightly Active",
      "description": "Exercise 1-3 days/week",
      "value": 1.375
    },
    ...
  ]
}
```

---

### Calculate Calories
```http
POST /calculator/calories
Content-Type: application/json
```

**Request Body:**
```json
{
  "gender": "male",
  "age": 28,
  "weight": 85,
  "height": 175,
  "activityLevel": 1.55,
  "goal": "lose"
}
```

**Response (200):**
```json
{
  "bmr": 1847,
  "tdee": 2863,
  "targetCalories": 2363,
  "bmi": 27.8,
  "bmiCategory": "Overweight",
  "recommendation": "To lose weight, aim for 2363 calories per day (-500 kcal deficit)"
}
```

**Calculation Logic:**
- **BMR** (Mifflin-St Jeor):
  - Male: `10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5`
  - Female: `10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161`
- **TDEE**: `BMR × activity factor`
- **Target**:
  - Lose: `TDEE - 500`
  - Maintain: `TDEE`
  - Gain: `TDEE + 500`

---

## 📈 Dashboard Endpoints (Nutritionist)

### Get Dashboard Stats
```http
GET /dashboard/stats
Authorization: Bearer <nutritionist_token>
```

**Response (200):**
```json
{
  "totalClients": 24,
  "activeClients": 18,
  "totalAppointments": 156,
  "upcomingAppointments": 8,
  "completedAppointments": 142,
  "cancelledAppointments": 6,
  "totalEarnings": 7800,
  "thisMonthEarnings": 1250,
  "avgRating": 4.7
}
```

---

### Get Chart Data
```http
GET /dashboard/chart?period=month
Authorization: Bearer <nutritionist_token>
```

**Query Parameters:**
- `period`: `week` | `month` | `year`

**Response (200):**
```json
{
  "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
  "appointments": [12, 15, 18, 14],
  "earnings": [600, 750, 900, 700]
}
```

---

## 📊 Database Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String (required, unique),
  email: String (required, unique),
  password: String (hashed with bcrypt),
  role: Enum ["customer", "nutritionist", "admin"],
  isApproved: Boolean (default: true for customers, false for nutritionists),
  credentialImage: String (Cloudinary URL, nutritionists only),
  profilePic: String (Cloudinary URL),
  isadmin: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Customer Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  age: Number,
  gender: Enum ["Male", "Female"],
  height: Number (cm),
  currentWeight: Number (kg),
  targetWeight: Number (kg),
  allergies: [String],
  goals: [
    {
      data: String,
      status: Enum ["pending", "done"],
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Nutritionist Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  specialization: [String],
  bio: String,
  cardBio: String,
  yearsOfExperience: Number,
  languages: [String],
  price: Number ($/hour),
  rating: Number (0-5),
  totalReviews: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Appointment Model
```javascript
{
  _id: ObjectId,
  nutritionistId: ObjectId (ref: 'User'),
  customerId: ObjectId (ref: 'User'),
  date: Date,
  time: String,
  duration: Number (minutes),
  status: Enum ["available", "pending", "booked", "completed", "cancelled"],
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### DietPlan Model
```javascript
{
  _id: ObjectId,
  customerId: ObjectId (ref: 'User'),
  nutritionistId: ObjectId (ref: 'User'),
  status: Enum ["pending", "in progress", "completed"],
  progress: Number (0-100),
  startDate: Date,
  endDate: Date,
  meals: [
    {
      date: Date,
      type: Enum ["breakfast", "lunch", "dinner", "snack"],
      description: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number,
      isDone: Boolean
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Model (AI)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  title: String,
  context: {
    age: Number,
    gender: String,
    weight: Number,
    height: Number,
    allergies: String,
    goal: String
  },
  messages: [
    {
      role: Enum ["user", "assistant"],
      content: String,
      timestamp: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Progress Model (DailyLog)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  date: Date,
  waterIntake: Number (ml),
  exerciseMinutes: Number,
  weight: Number (kg),
  mealsLogged: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔒 Authentication & Authorization

### JWT Token Structure

**Payload:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "customer",
  "isadmin": false,
  "iat": 1710936000,
  "exp": 1713528000
}
```

**Token Expiration**: 30 days (configurable)

### Role-Based Access Control

**Middleware Stack:**
1. `authToken` - Verifies JWT and attaches `req.user`
2. `isadmin` - Checks if `req.user.isadmin === true`
3. `cusValidation` - Checks if `req.user.role === 'customer'`
4. `nutriValidation` - Checks if `req.user.role === 'nutritionist'` AND `isApproved === true`

**Access Levels:**
- **Public**: No authentication required
- **Authenticated**: Any logged-in user
- **Customer**: Logged-in customers only
- **Nutritionist**: Approved nutritionists only
- **Admin**: Admin users only

### Password Security
- **Hashing**: bcrypt with salt rounds = 10
- **Min Length**: 8 characters
- **Storage**: Never store plain text passwords

---

## 🛡 Middleware

### Authentication Middleware (`verifyToken.js`)
```javascript
// Validates JWT token
// Attaches user data to req.user
// Returns 401 if token is invalid or expired
```

### Admin Middleware (`isadmin.js`)
```javascript
// Checks if req.user.isadmin === true
// Returns 403 if not an admin
```

### Customer Validation (`cusValidation.js`)
```javascript
// Checks if req.user.role === 'customer'
// Returns 403 if not a customer
```

### Nutritionist Validation (`nutriValidation.js`)
```javascript
// Checks if req.user.role === 'nutritionist'
// Checks if user.isApproved === true
// Returns 403 if not approved nutritionist
```

### Error Handling (`errorMiddleware.js`)
```javascript
// notFound: Handles 404 errors
// errorHandler: Catches all errors and sends formatted response
```

---

## ⚠️ Error Handling

### Error Response Format
```json
{
  "message": "Error description",
  "stack": "Error stack trace (development only)"
}
```

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

### Common Errors

**Invalid Token:**
```json
{
  "message": "Not authorized, token failed"
}
```

**Not Admin:**
```json
{
  "message": "Access denied: Admin only"
}
```

**Nutritionist Not Approved:**
```json
{
  "message": "Your account is pending admin approval"
}
```

---

## 🧪 Testing

### Manual Testing

**Test User Accounts** :

**Customers:**
```json
{ "username": "osamify", "password": "osamaalmany" }
{ "username": "reem", "password": "Reem123!" }
{ "username": "ramez", "password": "Ramez123!" }
```

**Nutritionists:**
```json
{ "username": "osama", "password": "Osama123!" }
```

### API Testing Tools

**Recommended:**
- **Postman**: Create collections for each endpoint
- **Thunder Client** (VS Code): Lightweight alternative
- **Insomnia**: REST client with nice UI
- **cURL**: Command-line testing

### Sample Postman Collection Structure

```
NutriLink API
├── Authentication
│   ├── Register Customer
│   ├── Register Nutritionist
│   ├── Login
│   └── Google OAuth
├── Customer
│   ├── Create Profile
│   ├── Get Profile
│   └── Update Profile
├── Nutritionist
│   ├── Create Profile
│   ├── Get All Nutritionists
│   └── Update Profile
├── Admin
│   ├── Get Pending
│   ├── Approve Nutritionist
│   └── Reject Nutritionist
├── Appointments
│   ├── Create Slot
│   ├── Book Appointment
│   ├── Get Schedule
│   └── Mark Completed
└── AI Chat
    ├── Create Chat
    ├── Send Message
    └── Get Messages
```

---

## 🔧 Scripts

### package.json Scripts

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "jest",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

---
-

