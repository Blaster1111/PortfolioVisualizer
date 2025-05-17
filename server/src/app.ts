import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import portfolioRoutes from "./routes/dashboard.routes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000", // for local development
      "https://portfolio-visualizer-six.vercel.app", // deployed frontend
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use('/api/portfolios', portfolioRoutes);

export default app;