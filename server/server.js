import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import http from "http";
import { connectDB } from "./lib/db.js";
import router from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

//Intialize socket.io server
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


//Store Online users
export const userSocketMap = {}; //{userId:socketId}

//Socke.io Connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);
  if(userId) userSocketMap[userId]=socket.id;

  //Emit online users to all connected
  io.emit("getOnlineUsers",Object.keys(userSocketMap));

  socket.on("disconnect",()=>{
    console.log("User Disconnected",userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers",Object.keys(userSocketMap));
  });
})

app.use(express.json({limit:"10mb"}));
app.use(cors({
   origin: [
      "http://localhost:5173",
      "https://your-frontend.vercel.app",
    ],
    credentials: true,
}));


//Routes setup
app.get("/api/status", (req, res) => {
  res.send("Server is running");
});

app.use("/api/auth", router);
app.use("/api/messages",messageRouter);

const startServer = async () => {
  try {
    await connectDB();

    if (process.env.NODE_ENV !== "production") {
      const PORT = process.env.PORT || 5001;

      server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer();
 export default app;