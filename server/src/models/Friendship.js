import mongoose from "mongoose";

const friendshipSchema = new mongoose.Schema(
  {
    users: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      validate: {
        validator: (value) => value.length === 2,
        message: "A friendship must contain exactly two users."
      }
    },
    pairKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Friendship", friendshipSchema);
