'use client';

import React, { useState } from 'react';
import type { MatchedListing } from '../../../app/discovery/actions';
import { RoomListingCard } from '../discovery/RoomListingCard';
import { sendMatchRequest } from '../../../app/discovery/actions';

interface RoomsPageClientProps {
  initialRooms: MatchedListing[];
}

export default function RoomsPageClient({ initialRooms }: RoomsPageClientProps) {
  const [connectingId, setConnectingId] = useState<string | null>(null);

  async function handleConnect(providerId: string) {
    setConnectingId(providerId);
    try {
      const result = await sendMatchRequest(providerId);
      if (result.error) {
        alert("Could not send match request: " + result.error);
      } else {
        alert("Request sent successfully!");
      }
    } finally {
      setConnectingId(null);
    }
  }

  if (initialRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md">
          <p className="text-slate-500 font-medium">
            No rooms available at the moment. Please check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {initialRooms.map((room) => (
        <RoomListingCard
          key={room.id}
          listing={room}
          distKm={null} // Distance not computed here for simplicity
          selectedRoomTags={[]} // No active tag filtering here for now
          connectingId={connectingId}
          onConnect={handleConnect}
          hideConnect={true}
        />
      ))}
    </div>
  );
}
