import React from 'react';
import { getAllRooms } from './actions';
import Navbar from '@/components/layout/Navbar';
import RoomsPageClient from '@/components/rooms/RoomsPageClient';

export const dynamic = 'force-dynamic';

export default async function RoomsPage() {
  const { rooms, error } = await getAllRooms();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar activeTab="Rooms" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-dark tracking-tight">Available Rooms</h1>
          <p className="text-slate-500 font-medium mt-1">
            Browse through all available room listings from other users.
          </p>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        ) : (
          <RoomsPageClient initialRooms={rooms} />
        )}
      </main>
    </div>
  );
}
