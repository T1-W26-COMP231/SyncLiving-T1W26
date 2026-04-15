"use server";

import { createClient } from '@/utils/supabase/server';
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
  console.log(`[系統檢查] 收到訊息: "${messageText}"，準備連線資料庫...`);

  const supabase = await createClient();

  // 1. ✨ 即時去資料庫抓取最新的敏感詞清單
  const { data: keywords, error } = await supabase
    .from("sensitive_keywords")
    .select("keyword, category");

  if (error) {
    console.error(`[系統錯誤] 抓取敏感詞失敗:`, error);
    // 如果資料庫壞了，通常我們會選擇「放行」訊息，以免整個聊天室癱瘓
    return { flagged: false };
  }

  console.log(`[系統檢查] 成功從資料庫載入 ${keywords?.length || 0} 個敏感詞`);

  // 2. 開始比對邏輯
  const lowerText = messageText.toLowerCase();
  const matchedKeyword = (keywords || []).find((kw) =>
    lowerText.includes(kw.keyword.toLowerCase()),
  );

  // 3. 如果抓到敏感詞 🚨
  if (matchedKeyword) {
    console.log(`[系統警告] 🚨 抓到敏感詞: ${matchedKeyword.keyword}`);

    // 直接寫入警報系統
    await supabase.from("admin_alerts").insert({
      type: "security",
      severity: "high",
      message: `Sensitive word '${matchedKeyword.keyword}' detected in message from user ${senderId}. Category: ${matchedKeyword.category}. Content snippet: "${messageText.substring(0, 50)}..."`,
      is_resolved: false,
    });

    return { flagged: true, keyword: matchedKeyword.keyword };
  }

  // 4. 如果沒事 ✅
  console.log(`[系統檢查] ✅ 安全通過，無敏感詞。`);
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
  pendingMessageReports: number;
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

/**
 * Fetches data for the live alerts feed based on category.
 */
export async function getLiveFeedData(category: 'critical-alerts' | 'user-reports'): Promise<FeedItem[]> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();

  if (category === 'critical-alerts') {
    const { data, error } = await supabase
      .from('admin_alerts')
      .select('id, message, created_at, severity')
      .eq('severity', 'high')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(item => ({
      id: item.id,
      displayMessage: item.message,
      createdAt: item.created_at,
      category: 'alert',
      severity: item.severity
    }));
  } else {
    const { data, error } = await supabase
      .from('user_reports')
      .select('id, reason, description, created_at')
      .eq('status', 'new')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(item => ({
      id: item.id,
      displayMessage: item.reason || item.description || 'No reason provided',
      createdAt: item.created_at,
      category: 'report'
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

  const [msgReportsRes, alertsRes] = await Promise.all([
    supabase
      .from("message_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("admin_alerts")
      .select("*")
      .eq("is_resolved", false)
      .order("created_at", { ascending: false }),
  ]);

  return {
    pendingMessageReports: msgReportsRes.count || 0,
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
  const { error } = await supabase
    .from("user_reports")
    .update({ status })
    .eq("id", reportId);
  if (error) throw new Error(error.message);
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
    userName: (ticket.profiles as any)?.full_name || 'Unknown User',
    userAvatar: (ticket.profiles as any)?.avatar_url,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status as any,
    priority: ticket.priority as any,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    messages: (messages || []).map(m => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: (m.profiles as any)?.full_name || 'Unknown',
      senderRole: (m.profiles as any)?.is_admin ? 'admin' : 'user',
      content: m.content,
      createdAt: m.created_at
    }))
  };
}

export async function sendTicketResponse(ticketId: string, content: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  const { error: msgError } = await supabase
    .from("support_messages")
    .insert({
      ticket_id: ticketId,
      sender_id: user.id,
      content
    });

  if (msgError) throw new Error(msgError.message);

  // Update ticket status to in_progress if it was open
  await supabase
    .from("support_tickets")
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
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
    .update({ status: 'closed', updated_at: new Date().toISOString() })
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

  return (data || []).map(t => ({
    id: t.id,
    userId: t.user_id,
    userName: (t.profiles as any)?.full_name || 'Unknown User',
    userAvatar: (t.profiles as any)?.avatar_url,
    subject: t.subject,
    description: t.description,
    status: t.status as any,
    priority: t.priority as any,
    createdAt: t.created_at,
    updatedAt: t.updated_at
  }));
}

export async function updateUserStatus(
  userId: string,
  status: string,
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
