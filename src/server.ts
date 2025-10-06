import app from "./app";
import dotenv from "dotenv";
import { initializeApp } from "./index";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await initializeApp();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
