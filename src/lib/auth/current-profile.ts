import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type Profile = Tables<"profiles">;

export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();
  // Same defensive catch as middleware.ts — getUser() can throw (not just
  // return an error) on a raced/already-used refresh token. Middleware
  // normally intercepts this first, but this is the one other place in the
  // app that calls getUser() directly, so it gets the same treatment.
  let user = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    user = null;
  }

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.must_change_password) redirect("/change-password");

  return profile;
}
