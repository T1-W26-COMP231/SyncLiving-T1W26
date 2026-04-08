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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .upsert(
      {
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        overall_comment: overallComment,
      },
      { onConflict: "reviewer_id, reviewee_id" },
    )
    .select("id")
    .single();

  if (reviewError) {
    console.error("Error creating/updating review:", reviewError);
    return { error: reviewError.message };
  }

  const scoreData = scores.map((s) => ({
    review_id: review.id,
    criteria_id: s.criteriaId,
    score: s.score,
  }));

  const { error: scoresError } = await supabase
    .from("review_scores")
    .upsert(scoreData, { onConflict: "review_id, criteria_id" });

  if (scoresError) {
    console.error("Error saving scores:", scoresError);
    return { error: scoresError.message };
  }

  revalidatePath("/reviews");
  return { success: true };
}

export async function reportReview(
  reviewId: string,
): Promise<{ success: boolean; error?: string }> {
  console.log("--- START reportReview ---");
  console.log("1. Received reviewId from frontend:", reviewId);

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

  console.log("2. Authenticated User ID:", user.id);

  const { data: updatedRows, error } = await supabase
    .from("reviews")
    .update({ status: "reported" })
    .eq("id", reviewId)
    .select();

  if (error) {
    return {
      success: false,
      error: `Failed to report review: ${error.message}`,
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

  console.log("4. Update successful! Revalidating path...");

  revalidatePath("/profile/[id]", "page");

  return { success: true };
}
