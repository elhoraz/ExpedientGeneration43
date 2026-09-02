import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Simple env parser
const envPath = path.join(process.cwd(), ".env.local");
const envFile = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
envFile.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const SUPABASE_KEY = envVars["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deleteAllUsers() {
  console.log("Fetching users...");
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching users:", error);
    process.exit(1);
  }

  if (users.length === 0) {
    console.log("No users found to delete.");
    return;
  }

  console.log(`Found ${users.length} users. Deleting...`);
  
  for (const user of users) {
    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) {
      console.error(`Error deleting user ${user.id}:`, delError);
    } else {
      console.log(`Deleted user: ${user.email} (${user.id})`);
    }
  }

  console.log("All users deleted successfully.");
}

deleteAllUsers();
