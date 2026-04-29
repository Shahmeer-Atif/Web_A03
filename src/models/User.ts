// User schema. Two roles only: admin and agent. Passwords are hashed with
// bcrypt cost 10 in a pre-save hook so callers never see plain-text in DB
// land. `password` is `select: false` so it's excluded from list queries —
// fetching it requires `.select('+password')` (used only in the auth flow).
//
// We do NOT add `import "server-only"` here because the seed script
// (plain Node) needs to import this module. Mongoose itself can't be
// bundled into a client component, which already prevents leakage.

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import bcrypt from "bcryptjs";

const PASSWORD_HASH_COST = 10;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "agent"] as const,
      default: "agent",
      index: true,
    },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.pre("save", async function preSave() {
  // Only re-hash when the password actually changed (e.g. password reset).
  // Mongoose 9 dropped the `next` callback for pre-save — return a promise.
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, PASSWORD_HASH_COST);
});

// Verify a plain-text password against the stored hash.
userSchema.methods.verifyPassword = function verifyPassword(plain: string) {
  return bcrypt.compare(plain, this.password);
};

// Strip password + version key from JSON output. Defence in depth — even
// if a route forgets to project it out, it won't leak.
userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    delete ret.password;
    delete ret._id;
    return ret;
  },
});

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  verifyPassword(plain: string): Promise<boolean>;
};

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", userSchema);
