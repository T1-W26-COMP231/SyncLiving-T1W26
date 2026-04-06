import { createClient } from "@/utils/supabase/server";

/**
 * Logs a user activity to the user_activity_logs table.
 * This can be used in server actions to track key user behaviors.
 */
export async function logActivity(
  userId: string,
  actionType:
    | "signup"
    | "profile_update"
    | "create_listing"
    | "update_listing"
    | "match_request_sent"
    | "match_request_responded"
    | "login"
    | "match_feedback_submitted",
  metadata: Record<string, any> = {},
) {
  const supabase = await createClient();

  const { error } = await supabase.from("user_activity_logs").insert({
    user_id: userId,
    action_type: actionType,
    metadata,
  });

  if (error) {
    console.error(
      `Failed to log activity [${actionType}] for user [${userId}]:`,
      error,
    );
  }
}
