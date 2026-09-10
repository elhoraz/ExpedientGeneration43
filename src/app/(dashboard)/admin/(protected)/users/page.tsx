import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import AdminUsersClient from "./AdminUsersClient";

export const metadata = {
  title: "Admin Users - Expedient",
};

export default async function AdminUsersPage() {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // Fetch all auth users using Admin API
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  
  // Fetch all profiles
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Merge emails into profiles
  const usersWithEmail = (profiles || []).map(profile => {
    const authUser = authData?.users?.find(u => u.id === profile.id);
    return {
      ...profile,
      email: authUser?.email || "No Email",
    };
  });

  return (
    <AdminUsersClient initialUsers={usersWithEmail} />
  );
}
