// Idempotent admin seeder. Reads SEED_ADMIN_EMAIL/PASSWORD/NAME from env.
// Run with `npm run seed`. Re-running is safe — if the admin already exists
// we leave it alone (and never overwrite a password).

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import mongoose from "mongoose";
import { User } from "../src/models/User";

async function main() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  if (!uri) throw new Error("MONGODB_URI missing");
  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");
  }

  await mongoose.connect(uri);

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      console.log(`Promoted existing user ${email} to admin.`);
    } else {
      console.log(`Admin ${email} already exists — no change.`);
    }
  } else {
    await User.create({ name, email, password, role: "admin" });
    console.log(`Created admin ${email}.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
