"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { logActivity } from "@/utils/activity-logger";
import { revalidatePath } from "next/cache";

/**
 * Creates a new support ticket for the authenticated user.
 */
export async function createSupportTicket(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create a support ticket." };
  }

  const subject = formData.get("subject") as string;
  const priority = formData.get("priority") as string;
  const description = formData.get("description") as string;

  if (!subject || !description) {
    return { error: "Subject and description are required." };
  }

  // 1. Fix the destructuring syntax here: error: dbError
  const { data: ticket, error: dbError } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      subject,
      priority: priority || "medium",
      description,
      status: "open",
    })
    .select("id")
    .single();

  if (dbError) {
    console.error("Error creating support ticket:", dbError);
    return { error: `Failed to create ticket: ${dbError.message}` };
  }

  // 2. Insert the first message
  await supabase.from("support_messages").insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    content: description,
  });

  // 3. Log activity
  await logActivity(user.id, "support_ticket_created", {
    ticket_id: ticket.id,
  });

  // 4. Clear list page cache (this line must be kept)
  revalidatePath("/support");

  // 5. [Key Modification] Do not redirect here, return success status instead
  return { success: true };
}

export async function getTicketDetails(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("user_id", user.id)
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
    ...ticket,
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

export async function sendTicketMessage(ticketId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("status")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .single();

  if (!ticket) throw new Error("Ticket not found");
  if (ticket.status === 'closed') throw new Error("Cannot message on a closed ticket");

  const { error: msgError } = await supabase
    .from("support_messages")
    .insert({
      ticket_id: ticketId,
      sender_id: user.id,
      content
    });

  if (msgError) throw new Error(msgError.message);

  revalidatePath(`/support/${ticketId}`);
  return { success: true };
}

/**
 * Fetches all support tickets for the current user.
 */
export async function getUserSupportTickets() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user tickets:", error);
    return [];
  }

  return data;
}
