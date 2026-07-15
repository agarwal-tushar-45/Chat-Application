//Sign Up A new User
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import dotenv from "dotenv";
dotenv.config();
import cloudinary from "../lib/cloudinary.js";

export const signUp = async (req, res) => {
  try {
    const { email, fullName, password ,bio} = req.body;
    if(!email || !fullName || !password || !bio){ 
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    const user =await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt=await bcrypt.genSalt(10);
    const hashedPassword=await bcrypt.hash(password,salt);

    const newUser=await User.create({
      fullName,email,password:hashedPassword,bio
    });

    const token= generateToken(newUser._id);

    res.json({success: true, token,userData:newUser,message:"User created successfully"});
  } catch(error){
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error",success:false });
  }
}


//controller to login a user

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;   
     const userData= await User.findOne({ email });
     if (!userData) {
    return res.status(400).json({
        success:false,
        message:"User not found"
    });
}

     const isPasswordCorrect=await bcrypt.compare(password,userData.password);
     if(!isPasswordCorrect){
      return res.status(400).json({ message: "Invalid credentials",success:false });
     }

     const token= generateToken(userData._id);

     res.json({success: true, userData, token, message:"User logged in successfully"});
  }catch(error){
    console.error("Error logging in user:", error);
  }
}

//controller to check user is authenticated

export const checkAuth = async (req, res) => {
  res.json({success:true,message:"User is authenticated",user: req.user});
}






//CONtroller to update user profile


export const updateProfile = async (req, res) => {
  try{
const { fullName, bio, profilePic } = req.body;
const userId=req.user._id;
let updateUser;
if(!profilePic){
  await User.findByIdAndUpdate(userId,{fullName,bio},{new:true});
  updateUser=await User.findById(userId).select("-password");
  res.json({success:true,message:"User profile updated successfully",user:updateUser});
}else{
  console.log("Type:", typeof profilePic);
console.log("Starts with data:image:", profilePic.startsWith("data:image"));
console.log("Length:", profilePic.length);
console.log(cloudinary.config());
  const upload=await cloudinary.uploader.upload(profilePic, {
  folder: "chat-app",
  resource_type: "image",
  });
 
  console.log("Upload successful");
  updateUser=await User.findByIdAndUpdate(userId,{fullName,bio,profilePic:upload.secure_url},{new:true});

  res.json({success:true,message:"User profile updated successfully",user:updateUser});
}
  }catch (error) {
    console.error("UPDATE PROFILE ERROR:");
  console.error(error);

  return res.status(500).json({
    success: false,
    message: error.message,
  });
  }
}