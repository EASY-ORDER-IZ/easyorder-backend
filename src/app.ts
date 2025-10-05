import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { notFoundHandler } from "./api/middlewares/notFoundHandler";

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
// ? app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.send("Server is healthy");
});

app.use(notFoundHandler);

export default app;
