import Link from "next/link";
import { redirect } from "next/navigation";
import { getReportTimeline, getUserReportById, resolveUserReport } from "../../actions";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ updated?: string; error?: string }>;
}

export default async function ReportDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const [report, timeline] = await Promise.all([
    getUserReportById(id),
    getReportTimeline(id),
  ]);
  const isResolved = report?.status === "resolved";
  const updatedState = resolvedSearchParams?.updated;
  const errorState = resolvedSearchParams?.error;

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-4">
        <h1 className="text-2xl font-bold">Report Not Found</h1>
        <p className="text-slate-600">This report may have been removed or you may not have permission to view it.</p>
        <Link href="/admin/reports" className="inline-flex px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold">
          Back to reports
        </Link>
      </div>
    );
  }

  const reportId = report.id;

  async function markInvestigating() {
    "use server";
    try {
      await resolveUserReport(reportId, "investigating", "Marked as investigating by administrator");
    } catch {
      redirect(`/admin/reports/${reportId}?error=investigating_failed`);
    }

    redirect(`/admin/reports/${reportId}?updated=investigating`);
  }

  async function resolveWithNote(formData: FormData) {
    "use server";
    const resolutionNote = String(formData.get("resolutionNote") || "").trim();
    try {
      await resolveUserReport(reportId, "resolved", resolutionNote);
    } catch {
      redirect(`/admin/reports/${reportId}?error=resolve_failed`);
    }

    redirect(`/admin/reports/${reportId}?updated=resolved`);
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Investigation</h1>
          <p className="text-sm text-slate-500 mt-1">Report ID: {report.id}</p>
        </div>
        <Link href="/admin/reports" className="inline-flex px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold">
          Back to reports
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-lg">Case Summary</h2>
        </div>
        <div className="p-5 grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <p className="text-slate-500">Reported user</p>
            <p className="font-semibold">{report.reportedUser}</p>
          </div>
          <div>
            <p className="text-slate-500">Reporter</p>
            <p className="font-semibold">{report.reporter}</p>
          </div>
          <div>
            <p className="text-slate-500">Reason</p>
            <p className="font-semibold">{report.reason}</p>
          </div>
          <div>
            <p className="text-slate-500">Status</p>
            <p className="font-semibold capitalize">{report.status}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-slate-500">Description</p>
            <p className="font-medium text-slate-700">{report.description || "No additional context provided."}</p>
          </div>
          <div>
            <p className="text-slate-500">Date submitted</p>
            <p className="font-semibold">{report.date}</p>
          </div>
          <div>
            <p className="text-slate-500">Resolved at</p>
            <p className="font-semibold">{report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : "Not resolved"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-slate-500">Resolution note</p>
            <p className="font-medium text-slate-700">{report.resolutionNote || "No resolution note yet."}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-lg">Case Timeline</h2>
        </div>
        <div className="p-5 space-y-3">
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-500">No timeline activity yet.</p>
          ) : (
            timeline.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-800">{item.event}</p>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-xs text-slate-600 mt-1">By: {item.actorName}</p>
                {item.note && <p className="text-sm text-slate-700 mt-2">{item.note}</p>}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-lg">Resolution Workflow</h2>
        </div>
        <div className="p-5 space-y-4">
          {updatedState === "investigating" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Report status updated to investigating.
            </div>
          )}

          {updatedState === "resolved" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Report resolved successfully and case has been locked.
            </div>
          )}

          {errorState && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to update this case. Refresh and try again.
            </div>
          )}

          {report.status === "new" && (
            <form action={markInvestigating}>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold"
              >
                Mark as Investigating
              </button>
            </form>
          )}

          <form action={resolveWithNote} className="space-y-3">
            <label htmlFor="resolutionNote" className="block text-sm font-semibold text-slate-700">
              Resolution note (sent to reporter)
            </label>
            <textarea
              id="resolutionNote"
              name="resolutionNote"
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/40"
              placeholder="Describe what was investigated and how the case was resolved."
              defaultValue={report.resolutionNote || ""}
              disabled={isResolved}
            />
            <button
              type="submit"
              disabled={isResolved}
              className="px-4 py-2 rounded-xl bg-admin-primary text-white hover:opacity-90 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResolved ? "Case Closed" : "Resolve and Notify Reporter"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
