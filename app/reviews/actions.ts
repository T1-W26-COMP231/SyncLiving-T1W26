"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserToReview {
  id: string;
  full_name: string;
  avatar_url: string;
  connection_id: string;
  average_score?: number;
}

export interface ReviewCriterion {
  id: string;
  label: string;
  category: string;
  description: string | null;
}

export interface ExistingReview {
  overall_comment: string;
  scores: Record<string, number>;
  status: string;
}

export async function getUsersToReview(): Promise<UserToReview[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_connections")
    .select(
      `
      id,
      user_1_id,
      user_2_id,
      profiles_1:user_1_id (id, full_name, avatar_url),
      profiles_2:user_2_id (id, full_name, avatar_url)
    `,
    )
    .eq("can_review", true)
    .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);

  if (error) {
    console.error("Error fetching users to review:", error);
    return [];
  }

  const revieweeIds = data.map((conn: any) =>
    conn.user_1_id === user.id ? conn.user_2_id : conn.user_1_id,
  );
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("reviewee_id, average_score")
    .eq("reviewer_id", user.id)
    .in("reviewee_id", revieweeIds);

  const scoreMap = new Map(
    reviewsData?.map((r) => [r.reviewee_id, Number(r.average_score)]),
  );

  return data.map((conn: any) => {
    const otherUser =
      conn.user_1_id === user.id ? conn.profiles_2 : conn.profiles_1;
    return {
      id: otherUser.id,
      full_name: otherUser.full_name || "Anonymous User",
      avatar_url: otherUser.avatar_url || "",
      connection_id: conn.id,
      average_score: scoreMap.get(otherUser.id) || 0,
    };
  });
}

export async function getReviewCriteria(): Promise<ReviewCriterion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("review_criteria")
    .select("id, label, category, description")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching criteria:", error);
    return [];
  }
  return data;
}

export async function getExistingReview(
  revieweeId: string,
): Promise<ExistingReview | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select(
      `
      id,
      overall_comment,
      status,
      review_scores (criteria_id, score)
    `,
    )
    .eq("reviewer_id", user.id)
    .eq("reviewee_id", revieweeId)
    .neq("status", "deleted") // Ignore deleted reviews
    .maybeSingle();

  if (reviewError || !review) return null;

  const scores: Record<string, number> = {};
  (review.review_scores as any[]).forEach((s) => {
    scores[s.criteria_id] = s.score;
  });

  return {
    overall_comment: review.overall_comment || "",
    scores,
    status: review.status || "active",
  };
}

export async function submitReview(
  revieweeId: string,
  overallComment: string,
  scores: { criteriaId: string; score: number }[],
) {
  console.log("--- START submitReview ---");
  console.log("Reviewer:", (await (await createClient()).auth.getUser()).data.user?.id);
  console.log("Reviewee:", revieweeId);
  console.log("Scores count:", scores.length);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // 1. Upsert the main review record
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .upsert(
      {
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        overall_comment: overallComment,
        status: 'active' // Ensure it's active when updated
      },
      { onConflict: "reviewer_id, reviewee_id" },
    )
    .select("id")
    .single();

  if (reviewError) {
    console.error("Error creating/updating review:", reviewError);
    return { error: reviewError.message };
  }

  if (!review) {
    console.error("Review upsert succeeded but no data returned");
    return { error: "Failed to retrieve review ID after save" };
  }

  console.log("Review record created/updated, ID:", review.id);

  // 2. Prepare score data
  const scoreData = scores.map((s) => ({
    review_id: review.id,
    criteria_id: s.criteriaId,
    score: s.score,
  }));

  if (scoreData.length > 0) {
    console.log("Upserting scores...");
    const { error: scoresError } = await supabase
      .from("review_scores")
      .upsert(scoreData, { onConflict: "review_id, criteria_id" });

    if (scoresError) {
      console.error("Error saving scores:", scoresError);
      return { error: scoresError.message };
    }
    console.log("Scores saved successfully");
  }

  console.log("Revalidating paths...");
  revalidatePath("/reviews");
  revalidatePath("/matches");
  revalidatePath(`/profile/${revieweeId}`);
  
  console.log("--- END submitReview SUCCESS ---");
  return { success: true };
}

export async function deleteReview(revieweeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Perform a soft delete by updating status to 'deleted'
  const { error } = await supabase
    .from("reviews")
    .update({ status: "deleted" })
    .eq("reviewer_id", user.id)
    .eq("reviewee_id", revieweeId);

  if (error) {
    console.error("Error soft-deleting review:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/reviews");
  revalidatePath("/matches");
  revalidatePath(`/profile/${revieweeId}`);

  return { success: true };
}

export async function reportReview(
  reviewId: string,
  reviewerId: string,
  reviewText: string,
): Promise<{ success: boolean; error?: string }> {
  console.log("--- START reportReview ---");
  console.log("1. Received reviewId from frontend:", reviewId);
  console.log("2. Target reviewerId:", reviewerId);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to report a review.",
    };
  }

  console.log("3. Authenticated User ID:", user.id);

  // 1. Update the review status
  const { data: updatedRows, error: updateError } = await supabase
    .from("reviews")
    .update({ status: "reported" })
    .eq("id", reviewId)
    .select();

  if (updateError) {
    console.error("Update error:", updateError);
    return {
      success: false,
      error: `Failed to report review: ${updateError.message}`,
    };
  }

  if (!updatedRows || updatedRows.length === 0) {
    console.warn(
      "4. WARNING: 0 rows updated! Either the ID is wrong, or RLS blocked it.",
    );
    return {
      success: false,
      error:
        "Could not update the review. It may not exist, or you do not have permission (RLS block).",
    };
  }

  // 2. Insert into user_reports to track as a formal report
  const { error: reportError } = await supabase.from("user_reports").insert({
    reporter_id: user.id,
    reported_user_id: reviewerId,
    reason: "Inappropriate Content",
    description: `Flagged malicious review (ID: ${reviewId}). Content: "${reviewText.substring(0, 100)}${reviewText.length > 100 ? "..." : ""}"`,
  });

  if (reportError) {
    console.error("Failed to insert into user_reports:", reportError);
    // We don't return error here because the status was already updated successfully
  }

  console.log("5. Success! Revalidating path...");

  revalidatePath("/profile/[id]", "page");

  return { success: true };
}
