import { Schema, model, models } from "mongoose";

type CommentState = "visible" | "pending" | "hidden" | "rejected";

const CommentSchema = new Schema(
  {
    noteId: { type: Schema.Types.ObjectId, ref: "Note", required: true, index: true },
    author: {
      name: String,
      email: { type: String, index: true },
    },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    state: { type: String, enum: ["visible", "pending", "hidden", "rejected"], default: "visible", index: true },
  },
  { timestamps: true }
);

export default models.Comment || model("Comment", CommentSchema);
