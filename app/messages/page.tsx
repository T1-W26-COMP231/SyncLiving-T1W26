import MessagingPage from '@/components/messaging/MessagingPage';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { conversation } = await searchParams;
  return <MessagingPage initialConversationId={conversation} />;
}
