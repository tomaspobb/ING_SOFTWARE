import { Schema, model, models, Types } from "mongoose";

const RatingSchema = new Schema(
  {
    noteId: { type: Schema.Types.ObjectId, ref: "Note", required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

// Evita votos duplicados por usuario y apunte
RatingSchema.index({ noteId: 1, userEmail: 1 }, { unique: true });

export default models.Rating || model("Rating", RatingSchema);
