import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoute from "./routes/auth.routes.js";
import userRoute from "./routes/user.routes.js";
import rideRoute from "./routes/ride.routes.js";

const app = express();
const PORT = 8080;

dotenv.config();  // Load environment variables from .env

// Connect to MongoDB
const connectDB = () => {
  mongoose.set("strictQuery", true);  // Enable strict mode in Mongoose queries

  mongoose
    .connect(process.env.MONGO)
    .then(() => console.log("Database connected"))
    .catch((error) => console.log("DB Connection Error:", error));
};

app.use(cors({
  origin: process.env.ORIGIN,  
  credentials: true,          
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],  
}));

// Other middlewares
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/rides", rideRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong";
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    error: errorMessage
  });
});

app.listen(PORT, () => {
  connectDB();  
  console.log(`Server running on http://localhost:${PORT}`);
});
