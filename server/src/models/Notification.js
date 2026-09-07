import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    type: {
      type: String,
      enum: ["friend_added", "paper_ring", "message"],
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 240
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
