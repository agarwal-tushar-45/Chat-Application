import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import {io,userSocketMap} from "../server.js";


//Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
  try{
    const userId=req.user._id;
    const filteredUsers=await User.find({_id:{$ne:userId}}).select("-password");

    //Count no of meassage not seen
    const unseenMessages={};
    const promises=filteredUsers.map(async (user)=>{
      const messages=await Message.find({sender:user._id,receiver:userId,seen:false});
      if(messages.length>0){
        unseenMessages[user._id]=messages.length;
      }
    });
    await Promise.all(promises);
    res.json({users:filteredUsers,unseenMessages});
  }catch(error){
    console.error("Error fetching users for sidebar:", error);
    res.status(500).json({message:"Internal server error",success:false});
  }
}

//Get all messages between logged in user and selected user

export const getMessages = async (req, res) => {
  try{
    const {id:selectedUserId}=req.params;
    const myId=req.user._id;
    const messages=await Message.find({
      $or:[
        {senderId:myId,receiverId:selectedUserId},
        {senderId:selectedUserId,receiverId:myId}
      ]
    })
    await Message.updateMany({senderId:selectedUserId,receiverId:myId,seen:false},{$set:{seen:true}});
    res.json({messages,success:true});
  }catch(error){
    console.error("Error fetching messages:", error);
    res.status(500).json({message:"Internal server error",success:false});
  }
}


//api to mark messages as seen when user opens the chat with selected user
export const markMessagesAsSeen = async (req, res) => {
  try{
    const {id}=req.params;
    await Message.findByIdAndUpdate(id,{$set:{seen:true}});
    res.json({success:true,message:"Message marked as seen"});
  }catch(error){
    console.error("Error marking message as seen:", error);
    res.status(500).json({message:"Internal server error",success:false});
  } 
}


//Send Message To Selected User

export const sendMessage = async (req, res) => {
  try{
    const {text,image}=req.body;
    const senderId=req.user._id;
    const receiverId=req.params.id;

    let imageUrl;
    if(image){
      const uploadResponse=await cloudinary.uploader.upload(image);
      imageUrl=uploadResponse.secure_url;
      
    }
    const newMessage=await Message.create({senderId,receiverId,text,image:imageUrl});

    //Emit the new message to the reciever socket
    const receiverSocketId=userSocketMap[receiverId];
    if(receiverSocketId){
      io.to(receiverSocketId).emit("newMessage",newMessage);
    }
    res.json({success:true,message:"Message sent successfully",newMessage});
  }
  catch(error){
    console.error("Error sending message:", error);
    res.status(500).json({message:"Internal server error",success:false});
  }
}
