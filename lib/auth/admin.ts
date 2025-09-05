// lib/auth/admin.ts
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function isUserAdmin(userId?: string | null) {
  if (!userId) return false;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.publicMetadata?.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
