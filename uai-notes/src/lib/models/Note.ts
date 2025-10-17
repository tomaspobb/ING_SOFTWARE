import { Schema, model, models, Types } from "mongoose";

export type ModerationState = "published" | "pending" | "rejected" | "hidden";

const NoteSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    subject: { type: String, index: true, trim: true },   // Asignatura
    topic: { type: String, index: true, trim: true },      // Tema
    semester: { type: String, index: true, trim: true },   // Ej: "Primavera 2025"
    tags: [{ type: String, index: true }],

    author: {
      name: String,
      email: { type: String, index: true },
    },

    // Archivo (luego lo conectamos a storage)
    fileUrl: String,
    fileType: String,
    fileSize: Number,

    stats: {
      views: { type: Number, default: 0, index: true },
      downloads: { type: Number, default: 0, index: true },
      ratingAvg: { type: Number, default: 0, min: 0, max: 5, index: true },
      ratingCount: { type: Number, default: 0, index: true },
    },

    moderation: {
      state: { type: String, enum: ["published", "pending", "rejected", "hidden"], default: "published", index: true },
      reason: String,
      decidedBy: String,
      decidedAt: Date,
    },
  },
  { timestamps: true }
);

NoteSchema.index({ title: "text", description: "text", tags: "text" });

export type TNote = typeof NoteSchema extends infer _ ? any : never;
export default models.Note || model("Note", NoteSchema);
