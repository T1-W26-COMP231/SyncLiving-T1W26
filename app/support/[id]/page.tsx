import { getTicketDetails } from "../actions";
import SupportTicketDetail from "@/components/support/SupportTicketDetail";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ticket = await getTicketDetails(id);

  if (!ticket) {
    notFound();
  }

  return <SupportTicketDetail ticket={ticket as any} />;
}
