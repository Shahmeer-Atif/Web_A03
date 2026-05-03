import mongoose, { Schema, model, models } from "mongoose";

export interface IMessage {
  _id: string;
  fromId: mongoose.Types.ObjectId;
  fromName: string;
  fromRole: string;
  toId: mongoose.Types.ObjectId | null; // null = broadcast to all admins
  body: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    fromId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fromName: { type: String, required: true },
    fromRole: { type: String, required: true },
    toId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    body: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

MessageSchema.index({ createdAt: -1 });

export const Message = models.Message ?? model<IMessage>("Message", MessageSchema);
