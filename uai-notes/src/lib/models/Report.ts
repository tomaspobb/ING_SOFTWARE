import { Schema, model, models } from "mongoose";

type TargetType = "note" | "comment";
type ReportStatus = "open" | "reviewed" | "dismissed";

const ReportSchema = new Schema(
  {
    targetType: { type: String, enum: ["note", "comment"], required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 2000 },
    by: { name: String, email: String },
    status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open", index: true },
  },
  { timestamps: true }
);

export default models.Report || model("Report", ReportSchema);
