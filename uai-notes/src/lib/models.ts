// src/lib/models.ts
import mongoose, { Schema } from "mongoose";
import { SUBJECTS } from "@/lib/subjects";

const MONGODB_URI = process.env.MONGODB_URI!;
export async function dbConnect() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI missing");
  const g = globalThis as any;
  if (!g._mongo) g._mongo = { conn: null, promise: null };
  if (g._mongo.conn) return g._mongo.conn;
  if (!g._mongo.promise) {
    g._mongo.promise = mongoose.connect(MONGODB_URI, {
      dbName: "notivium",
      bufferCommands: false,
    });
  }
  g._mongo.conn = await g._mongo.promise;
  return g._mongo.conn;
}

/* ------------ Note ------------ */
export type TNote = {
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  keywords?: string[];
  authorName?: string;
  authorEmail?: string;
  pdfUrl?: string;
  year?: number;
  semester?: number;

  downloads: number;
  views: number;
  ratingAvg: number;
  ratingCount: number;

  moderated: boolean; // aprobado
  rejected?: boolean; // rechazado

  createdAt: Date;
  updatedAt: Date;
};

const NoteSchema = new Schema<TNote>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subject: { type: String, required: true, enum: SUBJECTS },
    topic: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    authorName: String,
    authorEmail: String,
    pdfUrl: String,
    year: { type: Number, min: 2000, max: 2099 },
    semester: { type: Number, enum: [1, 2] },

    downloads: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    moderated: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Note =
  (mongoose.models.Note as mongoose.Model<TNote>) ??
  mongoose.model<TNote>("Note", NoteSchema);

/* ------------ Rating ------------ */
export type TRating = {
  noteId: mongoose.Types.ObjectId | string;
  userEmail: string;
  value: number; // 1..5
  createdAt: Date;
  updatedAt: Date;
};
const RatingSchema = new Schema<TRating>(
  {
    noteId: { type: Schema.Types.ObjectId, ref: "Note", index: true, required: true },
    userEmail: { type: String, index: true, required: true },
    value: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);
RatingSchema.index({ noteId: 1, userEmail: 1 }, { unique: true });

export const Rating =
  (mongoose.models.Rating as mongoose.Model<TRating>) ??
  mongoose.model<TRating>("Rating", RatingSchema);

/* ------------ Comment ------------ */
export type TComment = {
  noteId: mongoose.Types.ObjectId | string;
  userEmail: string;
  userName?: string;
  text: string;
  moderated: boolean; // aprobado (visible)
  rejected?: boolean;
  createdAt: Date;
  updatedAt: Date;
};
const CommentSchema = new Schema<TComment>(
  {
    noteId: { type: Schema.Types.ObjectId, ref: "Note", index: true, required: true },
    userEmail: { type: String, index: true, required: true },
    userName: String,
    text: { type: String, required: true },
    moderated: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Comment =
  (mongoose.models.Comment as mongoose.Model<TComment>) ??
  mongoose.model<TComment>("Comment", CommentSchema);
