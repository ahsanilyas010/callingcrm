"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
}

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Deliberately generic — don't reveal whether the account exists.
    return { error: "Incorrect email or password." };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString(), last_login_ip: ip, failed_login_count: 0 })
    .eq("id", data.user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("must_change_password")
    .eq("id", data.user.id)
    .single();

  redirect(profile?.must_change_password ? "/change-password" : next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 10) {
    return { error: "Minimum 10 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("profiles")
    .update({ must_change_password: false, password_set_at: new Date().toISOString() })
    .eq("id", user!.id);

  await supabase.from("credential_events").insert({
    user_id: user!.id,
    actor_id: user!.id,
    event: "changed_by_user",
  });

  redirect("/");
}
