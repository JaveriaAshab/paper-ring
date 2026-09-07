import mongoose from "mongoose";

const paperRingSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 4000
    }
  },
  { timestamps: true }
);

paperRingSchema.index({ sender: 1, recipient: 1 }, { unique: true });

export default mongoose.model("PaperRing", paperRingSchema);
