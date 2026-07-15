import User from "../models/User.js";
import jwt from "jsonwebtoken";


//middleware to protect route

export const protectRoute = async (req, res, next) => {
  try{
    const token = req.headers.token;
  
const decoded=jwt.verify(token,process.env.JWT_SECRET);

    const user=await User.findById(decoded.userId).select("-password");
    if(!user){
      return res.status(401).json({message:"Unauthorized access"});
    }
    req.user=user;
    next();
  }catch(error){

    console.error("Error in protectRoute middleware:", error);
    res.json({message:error.message,success:false});
  }
}