"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserToReview {
  id: string;
  full_name: string;
  avatar_url: string;
  connection_id: string;
  average_score?: number;
  lifestyle_tags?: string[];
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
  average_score: number;
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
      profiles_1:user_1_id (id, full_name, avatar_url, lifestyle_tags),
      profiles_2:user_2_id (id, full_name, avatar_url, lifestyle_tags)
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
  const { data: reviewsData } = (await supabase
    .from("reviews")
    .select("reviewee_id, average_score")
    .eq("reviewer_id", user.id)
    .in("reviewee_id", revieweeIds)) as any;

  const scoreMap = new Map(
    reviewsData?.map((r: any) => [r.reviewee_id, Number(r.average_score)]),
  );

  return data.map((conn: any) => {
    const otherUser =
      conn.user_1_id === user.id ? conn.profiles_2 : conn.profiles_1;
    return {
      id: otherUser.id,
      full_name: otherUser.full_name || "Anonymous User",
      avatar_url: otherUser.avatar_url || "",
      connection_id: conn.id,
      average_score: (scoreMap.get(otherUser.id) as number) || 0,
      lifestyle_tags: (otherUser as any).lifestyle_tags || [],
    };
  });
}

export async function getRevieweeTags(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("lifestyle_tags")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user tags:", error);
    return [];
  }
  return data.lifestyle_tags || [];
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

  const { data: review, error: reviewError } = (await supabase
    .from("reviews")
    .select(
      `
      id,
      overall_comment,
      average_score,
      status,
      review_scores (criteria_id, score)
    `,
    )
    .eq("reviewer_id", user.id)
    .eq("reviewee_id", revieweeId)
    .neq("status", "deleted") // Ignore deleted reviews
    .maybeSingle()) as any;

  if (reviewError || !review) return null;

  const scores: Record<string, number> = {};
  (review.review_scores as any[]).forEach((s) => {
    scores[s.criteria_id] = s.score;
  });

  return {
    overall_comment: review.overall_comment || "",
    average_score: Number(review.average_score) || 0,
    scores,
    status: review.status || "active",
  };
}

export async function submitReview(
  revieweeId: string,
  overallComment: string,
  scores: { criteriaId: string; score: number }[],
  starRating: number,
) {
  console.log("--- START submitReview ---");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  console.log("Reviewer:", user.id);
  console.log("Reviewee:", revieweeId);
  console.log("Star Rating (average_score):", starRating);

  // 1. Upsert the main review record
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .upsert(
      {
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        overall_comment: overallComment,
        overall_rating: Math.round(starRating), // New explicit integer rating column (1-5)
        average_score: starRating, // Keep decimal score for backward compatibility
        status: 'active'
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
    return { error: "Failed to retrieve review ID after save" };
  }

  // 2. Prepare score data
  const scoreData = scores.map((s) => ({
    review_id: review.id,
    criteria_id: s.criteriaId,
    score: s.score,
  }));

  if (scoreData.length > 0) {
    const { error: scoresError } = await supabase
      .from("review_scores")
      .upsert(scoreData, { onConflict: "review_id, criteria_id" });

    if (scoresError) {
      console.error("Error saving scores:", scoresError);
      return { error: scoresError.message };
    }
  }

  revalidatePath("/reviews");
  revalidatePath("/matches");
  revalidatePath(`/profile/${revieweeId}`);
  
  console.log('Saved review', { reviewId: review.id, scoresSaved: scoreData.length });
  return { success: true, reviewId: review.id, scoresSaved: scoreData.length };
}

export async function deleteReview(revieweeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error: updateError } = await supabase
    .from("reviews")
    .update({ status: "reported" })
    .eq("id", reviewId);

  if (updateError) return { success: false, error: updateError.message };

  await supabase.from("user_reports").insert({
    reporter_id: user.id,
    reported_user_id: reviewerId,
    reason: "Inappropriate Content",
    description: `Flagged review ID: ${reviewId}. Content: "${reviewText.substring(0, 100)}"`,
  });

  revalidatePath("/profile/[id]", "page");
  return { success: true };
}
