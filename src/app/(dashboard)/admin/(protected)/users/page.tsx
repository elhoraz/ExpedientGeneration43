import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminUsersClient from "./AdminUsersClient";

export const metadata = {
  title: "Admin Users - Expedient",
};

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all auth users using Admin API
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  
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
