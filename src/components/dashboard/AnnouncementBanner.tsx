import { createClient } from "@/utils/supabase/server";
import { Megaphone } from "lucide-react";

export default async function AnnouncementBanner() {
  const supabase = await createClient();

  // get the latest announcement from the database
  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching announcements:", error);
    return null;
  }

  const latestAnnouncement = announcements?.[0];

  // return null if there are no announcements or if the latest announcement is older than 7 days
  if (!latestAnnouncement) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 p-4 shadow-md transition-all hover:shadow-lg dark:border-amber-800 dark:border-l-amber-500 dark:bg-amber-950/40">
      <div className="flex items-start gap-4">
        <div className="mt-1 text-amber-600 dark:text-amber-400">
          <Megaphone className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-amber-900 dark:text-amber-100">
            {latestAnnouncement.title}
          </h3>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200/90 leading-relaxed">
            {latestAnnouncement.message}
          </p>
        </div>
      </div>
    </div>
  );
}
