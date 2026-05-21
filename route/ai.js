const express=require('express')
const router= express.Router()
const asyncHandler=require('express-async-handler')
const Chat= require('../model/Ai')
const OpenAI =require( "openai");
const Customer=require('../model/Customer')
const client = new OpenAI({
    apiKey:process.env.OPENAI_API_KEY
});
//creat new chat 
router.post('/chat', authToken, asyncHandler(async (req, res) => {

  const customer = await Customer.findOne({ user: req.user.id });

  let context = {
    age: null,
    gender: null,
    weight: null,
    height: null,
    allergies: "None",
    goal: "No active goal"
  };

  if (customer) {
    const goal = customer.goals.find(g => g.status === "pending");

    context = {
      age: customer.age,
      gender: customer.gender,
      weight: customer.currentWeight,
      height: customer.height,
      allergies: customer.allergies?.length
        ? customer.allergies.join(", ")
        : "None",
      goal: goal?.data || "No active goal"
    };
  }

  const chat = new Chat({
    title: req.body.title || "New Chat",
    user: req.user.id,
    context
  });

  await chat.save();

  res.status(201).json(chat);

}));
//sent message and take the replay
router.post('/:id', authToken, asyncHandler(async (req, res) => {

  if (!req.body.message || !req.body.message.trim()) {
    res.status(400);
    throw new Error("Message is required");
  }

  const userMessage = req.body.message.trim();

  const chat = await Chat.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found or not authorized");
  }

  const previousMessages = chat.messages.slice(-8);

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: `
You are a professional nutritionist assistant.
You only answer questions related to nutrition, diet, food, calories, macronutrients, micronutrients, fitness, and healthy lifestyle.
If a question is outside nutrition, reply exactly with:
"I am a nutrition assistant and I can only answer questions related to nutrition and health."
Answer clearly and concisely.
Use Markdown formatting (headings, bullet points, bold when helpful).
Avoid repetition.
Do not guess or invent information.
If unsure whether the question is nutrition-related, treat it as outside your domain.


Customer Profile:
- Age: ${chat.context.age}
- Gender: ${chat.context.gender}
- Weight: ${chat.context.weight}
- Height: ${chat.context.height}
- Allergies: ${chat.context.allergies}
- Goal: ${chat.context.goal}
`
      },
      ...previousMessages,
      { role: "user", content: userMessage }
    ]
  });

  const aiReply = response.output_text;

  chat.messages.push({ role: "user", content: userMessage });
  chat.messages.push({ role: "assistant", content: aiReply });

  await chat.save();

  res.status(200).json({
    reply: aiReply
  });

}));
//get messages
router.get('/messages/:id', authToken, asyncHandler(async (req, res) => {

  const chat = await Chat.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found or not authorized");
  }

  res.status(200).json(chat.messages);

})); 
// Get all chat 
router.get('/chat', authToken, asyncHandler(async (req, res) => {

  const chat = await Chat.find({ user: req.user.id })
  .select("_id title").sort({createdAt:-1})

  if (chat.length==0) {
    res.status(404);
    throw new Error("no any chat yet");
  }

  res.status(200).json(chat);

})); 
//delete chat 
router.delete('/chat/:id',authToken,asyncHandler(async(req,res)=>{
  
 const chat= await Chat.findOneAndDelete({
  _id:req.params.id,
  user:req.user.id
 })
 if(!chat){
  res.status(404)
  throw new Error("Chat not found")
 }
 res.status(200).json("chat has been deleted")
}))
module.exports=router