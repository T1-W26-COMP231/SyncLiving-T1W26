"use server";

import { createClient } from "@/utils/supabase/server";
// import { createClient as createStandardClient } from "@supabase/supabase-js";
import { log } from "console";
import { revalidatePath, unstable_cache } from "next/cache";

/**
 * Security helper to verify if the current user is an admin.
 */
async function isAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return !!profile?.is_admin;
}

export async function checkMessageForSensitiveWords(
  messageText: string,
  senderId: string,
) {
  const supabase = await createClient();

  // 1. fetch the list of sensitive keywords from the database. We can cache this for a short period (e.g. 5 minutes) to reduce database load, since the list of keywords probably doesn't change very often. For simplicity, we'll fetch it every time here, but in a real implementation we would want to optimize this.
  const { data: keywords, error } = await supabase
    .from("sensitive_keywords")
    .select("keyword, category");

  if (error) {
    // if we can't fetch the keywords, we should probably fail open (not flag) to avoid false positives, but log the error for admins to fix.
    return { flagged: false };
  }

  // 2. start checking the message against the keywords. We can optimize this by lowercasing the message once and doing a simple substring check, since we want to catch keywords even if they are part of a larger word (e.g. "badword" in "thisisabadword").
  const lowerText = messageText.toLowerCase();
  const matchedKeyword = (keywords || []).find((kw) =>
    lowerText.includes(kw.keyword.toLowerCase()),
  );

  // 3. get the matched keyword (if any) and log it. We should also write this to a separate "alerts" table in the database so that admins can review it later. This is important for auditing and improving our keyword list over time.
  if (matchedKeyword) {
    // insert an alert into the database for admins to review. We can include details like the sender ID, the matched keyword, and a snippet of the message for context.
    await supabase.from("admin_alerts").insert({
      type: "security",
      severity: "high",
      message: `Sensitive word '${matchedKeyword.keyword}' detected in message from user ${senderId}. Category: ${matchedKeyword.category}. Content snippet: "${messageText.substring(0, 50)}..."`,
      is_resolved: false,
    });

    return { flagged: true, keyword: matchedKeyword.keyword };
  }

  // 4. no keywords matched, return false. We can also log this for debugging purposes, but in a real system we might want to limit the logging of non-flagged messages to avoid cluttering the logs.
  return { flagged: false };
}

/**
 * Flags a message and inserts it into message_reports.
 */
export async function flagMessage(
  messageId: string,
  reporterId: string,
  reason: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("message_reports").insert({
    message_id: messageId,
    reporter_id: reporterId,
    reason: reason,
    status: "pending",
  });

  if (error) throw new Error(`Failed to report message: ${error.message}`);
  return { success: true };
}

export interface AdminDashboardOverview {
  newUserReports: number;
  unresolvedAlerts: {
    id: string;
    type: "security" | "system" | "performance";
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    created_at: string;
  }[];
}

export interface FeedItem {
  id: string;
  displayMessage: string;
  createdAt: string;
  category: 'alert' | 'report';
  severity?: string;
}

export interface UserReport {
  id: string;
  reportedUserId: string;
  reportedUser: string;
  avatarUrl: string | null;
  reason: string;
  reporter: string;
  reporterId: string;
  status: string;
  date: string;
}

export interface UserReportDetail extends UserReport {
  description: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface ModerationReview {
  id: string;
  stars: number;
  listing: string;
  author: string;
  text: string;
  flagReason: string;
}

export interface ReportTimelineItem {
  id: string;
  createdAt: string;
  event: string;
  note: string;
  actorName: string;
}

/**
 * Fetches data for the live alerts feed based on category.

 */
export async function getLiveFeedData(
  category: "critical-alerts" | "user-reports",
): Promise<FeedItem[]> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();

  if (category === "critical-alerts") {
    const { data, error } = await supabase
      .from("admin_alerts")
      .select("id, message, created_at, severity")
      .eq("severity", "high")
      .eq("is_resolved", false)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((item) => ({
      id: item.id,
      displayMessage: item.message,
      createdAt: item.created_at,
      category: "alert",
      severity: item.severity,
    }));
  } else {
    const { data, error } = await supabase
      .from("user_reports")
      .select("id, reason, description, created_at")
      .eq("status", "new")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((item) => ({
      id: item.id,
      displayMessage: item.reason || item.description || "No reason provided",
      createdAt: item.created_at,
      category: "report",
    }));
  }
}

/**
 * Fetches summary statistics for the admin dashboard.
 * Implementation: Promise.all executes queries concurrently, minimizing
 * total wait time (latency) for the page to render.
 */
export async function getAdminDashboardOverview(): Promise<AdminDashboardOverview> {
  if (!(await isAdmin())) throw new Error("Unauthorized");

  const supabase = await createClient();

  const [newReportsRes, alertsRes] = await Promise.all([
    supabase
      .from("user_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("admin_alerts")
      .select("*")
      .eq("is_resolved", false)
      .order("created_at", { ascending: false }),
  ]);

  return {
    newUserReports: newReportsRes.count || 0,
    unresolvedAlerts: (alertsRes.data || []) as any,
  };
}

/**
 * Resolves a system alert.
 */
export async function resolveAlert(alertId: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from("admin_alerts")
    .update({ is_resolved: true })
    .eq("id", alertId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/dashboard");
  return { success: true };
}

// RESTORED FUNCTIONS FROM PREVIOUS VERSION
export async function searchUsers(query: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .or(`full_name.ilike.%${query}%`)
    .limit(10);
  if (error) return [];
  return data;
}

export async function getUserFullDetails(userId: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();
  const [
    profileRes,
    listingsRes,
    connectionsRes,
    reviewsGivenRes,
    reviewsReceivedRes,
    activityLogsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("room_listings").select("*").eq("provider_id", userId),
    supabase
      .from("user_connections")
      .select(
        "*, profiles_1:user_1_id (id, full_name), profiles_2:user_2_id (id, full_name)",
      )
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`),
    supabase
      .from("reviews")
      .select("*, reviewee:reviewee_id(full_name)")
      .eq("reviewer_id", userId),
    supabase
      .from("reviews")
      .select("*, reviewer:reviewer_id(full_name)")
      .eq("reviewee_id", userId),
    supabase
      .from("user_activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (profileRes.error)
    throw new Error(`Error fetching profile: ${profileRes.error.message}`);
  return {
    profile: profileRes.data,
    listings: listingsRes.data || [],
    connections: connectionsRes.data || [],
    reviewsGiven: reviewsGivenRes.data || [],
    reviewsReceived: reviewsReceivedRes.data || [],
    activityLogs: activityLogsRes.data || [],
  };
}

export async function getUserReports() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const userIds = [
    ...new Set([
      ...data.map((r) => r.reported_user_id),
      ...data.map((r) => r.reporter_id),
    ]),
  ];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return data.map((r) => ({
    id: r.id,
    reportedUserId: r.reported_user_id,
    reportedUser: profileMap.get(r.reported_user_id)?.full_name || "Unknown",
    avatarUrl: profileMap.get(r.reported_user_id)?.avatar_url || null,
    reason: r.reason,
    reporter: profileMap.get(r.reporter_id)?.full_name || "Unknown",
    reporterId: r.reporter_id,
    status: r.status,
    date: new Date(r.created_at).toLocaleDateString(),
  }));
}

export async function updateReportStatus(reportId: string, status: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();

  if (status !== "investigating") {
    throw new Error("Unsupported status transition");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existing, error: fetchError } = await supabase
    .from("user_reports")
    .select("id, status")
    .eq("id", reportId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Report not found");
  }

  if (existing.status === "resolved") {
    throw new Error("Resolved reports are locked");
  }

  const { error } = await supabase
    .from("user_reports")
    .update({ status })
    .eq("id", reportId);

  if (error) throw new Error(error.message);

  await supabase.from("user_activity_logs").insert({
    user_id: user.id,
    actor_id: user.id,
    action_type: "report_investigating",
    action: "report_investigating",
    object_type: "user_report",
    object_id: reportId,
    metadata: {
      note: "Marked as investigating",
    },
  });

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${reportId}`);

  return { success: true };
}

export async function getUserReportById(
  reportId: string,
): Promise<UserReportDetail | null> {
  if (!(await isAdmin())) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (error || !data) {
    return null;
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", [data.reported_user_id, data.reporter_id]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const row = data as any;

  return {
    id: row.id,
    reportedUserId: row.reported_user_id,
    reportedUser: profileMap.get(row.reported_user_id)?.full_name || "Unknown",
    avatarUrl: profileMap.get(row.reported_user_id)?.avatar_url || null,
    reason: row.reason,
    reporter: profileMap.get(row.reporter_id)?.full_name || "Unknown",
    reporterId: row.reporter_id,
    status: row.status,
    date: new Date(row.created_at).toLocaleDateString(),
    description: row.description ?? null,
    resolutionNote: row.resolution_note ?? null,
    resolvedAt: row.resolved_at ?? null,
    resolvedBy: row.resolved_by ?? null,
  };
}

export async function getReportTimeline(
  reportId: string,
): Promise<ReportTimelineItem[]> {
  if (!(await isAdmin())) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_activity_logs")
    .select("id, created_at, action_type, metadata, actor_id")
    .eq("object_type", "user_report")
    .eq("object_id", reportId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) {
    return [];
  }

  const actorIds = [
    ...new Set(
      data
        .map((row: any) => row.actor_id)
        .filter((id: string | null) => !!id),
    ),
  ] as string[];

  let actorNameMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);

    actorNameMap = new Map(
      (actors ?? []).map((actor) => [actor.id, actor.full_name || "Admin"]),
    );
  }

  const labelMap: Record<string, string> = {
    report_resolved: "Report Resolved",
    report_investigating: "Marked as Investigating",
    report_created: "Report Submitted",
  };

  return data.map((row: any) => {
    const metadata = (row.metadata ?? {}) as { note?: string };
    return {
      id: String(row.id),
      createdAt: row.created_at,
      event: labelMap[row.action_type] || row.action_type || "Activity",
      note: metadata.note || "",
      actorName: row.actor_id ? actorNameMap.get(row.actor_id) || "Admin" : "System",
    };
  });
}

export async function resolveUserReport(
  reportId: string,
  status: "investigating" | "resolved",
  resolutionNote: string,
) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existing, error: fetchError } = await supabase
    .from("user_reports")
    .select("id, reporter_id, status")
    .eq("id", reportId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Report not found");
  }

  if (existing.status === "resolved") {
    throw new Error("Resolved reports are locked");
  }

  const updatePayload: Record<string, any> = {
    status,
  };

  if (status === "resolved") {
    updatePayload.resolution_note = resolutionNote || "Resolved by administrator";
    updatePayload.resolved_at = new Date().toISOString();
    updatePayload.resolved_by = user.id;
  }

  const { error: updateError } = await (supabase as any)
    .from("user_reports")
    .update(updatePayload)
    .eq("id", reportId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Audit trail for moderator actions.
  await supabase.from("user_activity_logs").insert({
    user_id: user.id,
    actor_id: user.id,
    action_type: status === "resolved" ? "report_resolved" : "report_investigating",
    action: status === "resolved" ? "report_resolved" : "report_investigating",
    object_type: "user_report",
    object_id: reportId,
    metadata:
      status === "resolved"
        ? {
            note: resolutionNote || "Resolved by administrator",
          }
        : {
            note: "Marked as investigating",
          },
  });

  if (status === "resolved") {
    await (supabase as any).from("user_notifications").insert({
      user_id: existing.reporter_id,
      type: "report_resolution",
      title: "Your misconduct report has been resolved",
      message: resolutionNote || "An administrator has reviewed and resolved your report.",
      related_object_type: "user_report",
      related_object_id: reportId,
    });
  }

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${reportId}`);

  return { success: true };
}

export async function getFlaggedReviewsForModeration(): Promise<ModerationReview[]> {
  if (!(await isAdmin())) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, overall_comment, overall_rating, average_score, reviewer_id, reviewee_id, status")
    .eq("status", "reported")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  const profileIds = [
    ...new Set(data.flatMap((row: any) => [row.reviewer_id, row.reviewee_id])),
  ];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", profileIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return data.map((row: any) => ({
    id: row.id,
    stars: row.overall_rating ?? Math.round(Number(row.average_score) || 0),
    listing: "N/A",
    author: profileMap.get(row.reviewer_id) || "Unknown",
    text: row.overall_comment || "No review text provided",
    flagReason: "Reported by user",
  }));
}

export async function moderateReviewStatus(
  reviewId: string,
  status: "active" | "deleted",
) {
  if (!(await isAdmin())) throw new Error("Unauthorized");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("reviews")
    .update({ status })
    .eq("id", reviewId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("user_activity_logs").insert({
    user_id: user.id,
    actor_id: user.id,
    action_type: status === "deleted" ? "review_removed" : "review_restored",
    action: status === "deleted" ? "review_removed" : "review_restored",
    object_type: "review",
    object_id: reviewId,
    metadata: {
      status,
    },
  });

  revalidatePath("/admin/reports");
  revalidatePath("/profile/[id]", "page");
  revalidatePath("/matches");
  return { success: true };
}

export async function getTicketDetails(ticketId: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("*, profiles:user_id(full_name, avatar_url)")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) {
    console.error("Error fetching ticket details:", ticketError);
    return null;
  }

  const { data: messages, error: messagesError } = await supabase
    .from("support_messages")
    .select("*, profiles:sender_id(full_name, is_admin)")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Error fetching ticket messages:", messagesError);
  }

  return {
    id: ticket.id,
    userId: ticket.user_id,
    userName: (ticket.profiles as any)?.full_name || "Unknown User",
    userAvatar: (ticket.profiles as any)?.avatar_url,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status as any,
    priority: ticket.priority as any,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    messages: (messages || []).map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: (m.profiles as any)?.full_name || "Unknown",
      senderRole: (m.profiles as any)?.is_admin ? "admin" : "user",
      content: m.content,
      createdAt: m.created_at,
    })),
  };
}

export async function sendTicketResponse(ticketId: string, content: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  const { error: msgError } = await supabase.from("support_messages").insert({
    ticket_id: ticketId,
    sender_id: user.id,
    content,
  });

  if (msgError) throw new Error(msgError.message);

  // Update ticket status to in_progress if it was open
  await supabase
    .from("support_tickets")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .eq("status", "open");

  revalidatePath(`/admin/support/${ticketId}`);
  return { success: true };
}

export async function closeTicket(ticketId: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();

  const { error } = await supabase
    .from("support_tickets")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
  return { success: true };
}

export async function getSupportTickets() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*, profiles:user_id(full_name, avatar_url)")
    .neq("status", "closed")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching support tickets:", error);
    return [];
  }

  return (data || []).map((t) => ({
    id: t.id,
    userId: t.user_id,
    userName: (t.profiles as any)?.full_name || "Unknown User",
    userAvatar: (t.profiles as any)?.avatar_url,
    subject: t.subject,
    description: t.description,
    status: t.status as any,
    priority: t.priority as any,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
}

export async function updateUserStatus(
  userId: string,
  status: "suspended" | "banned" | "active",
  reason?: string,
  suspendedUntil?: string,
) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      account_status: status,
      status_reason: reason || null,
      suspended_until: status === "suspended" ? suspendedUntil || null : null,
    })
    .eq("id", userId)
    .select();
  if (error) throw new Error(error.message);
  return data[0];
}

/**
 * Creates and publishes a platform-wide announcement.
 * Only accessible by administrators.
 */
export async function createAnnouncement(formData: FormData) {
  if (!(await isAdmin())) return { error: "Unauthorized" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const title = formData.get("title") as string;
  const message = formData.get("message") as string;

  if (!title || !message) {
    return { error: "Title and message are required" };
  }

  const { error } = await supabase.from("announcements").insert({
    title,
    message,
    created_by: user.id,
  });

  if (error) {
    console.error("Error creating announcement:", error);
    return { error: "Failed to publish" };
  }

  // Revalidate relevant paths to show the new announcement
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");

  return { success: true, message: "Announcement published successfully" };
}
