import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { nanoid } from "nanoid";
import cors from "cors";

import urlRoutes from "./routes/urlRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// middleware
app.use(express.json())
app.use(cors());

app.get("/", (req, res) => {
    res.send("HELLO");
});

app.use("/api", urlRoutes);
app.use("/api/auth", authRoutes);

mongoose.connect(process.env.MONGODBURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on http://localhost:${process.env.PORT}`);
    });
}).catch( err => {
    console.log(err);
});