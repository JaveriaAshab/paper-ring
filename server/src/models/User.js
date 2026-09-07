import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationToken: {
      type: String,
      select: false
    },

    emailVerificationExpires: {
      type: Date,
      select: false
    },
    password: {
      type: String,
      required: false,
      select: false
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    friendCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 240,
      default: ""
    },
    profilePicture: {
      type: String,
      trim: true,
      default: ""
    },
    banner: {
      type: String,
      trim: true,
      default: ""
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
