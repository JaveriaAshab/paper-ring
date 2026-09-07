import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      default: ""
    },
    email: {
      type: String,
      trim: true,
      maxlength: 160,
      default: ""
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    }
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
