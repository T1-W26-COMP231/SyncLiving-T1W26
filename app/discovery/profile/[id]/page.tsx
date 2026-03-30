import { ProfileDetails } from '@/components/discovery/ProfileDetails';

// Mock data for initial development
const MOCK_PROFILE = {
  id: 'user-123',
  full_name: 'Sarah Mitchell',
  avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
  bio: 'Hi there! I am a software engineer looking for a quiet place in the city. I am clean, organized, and love to cook. I usually spend my weekends hiking or reading at a local cafe. I am looking for a roommate who is respectful of personal space but also down for a movie night once in a while.',
  age: 26,
  location: 'Toronto, ON',
  role: 'seeker' as const,
  lifestyle_tags: ['Non-Smoker', 'Quiet', 'Early Bird', 'Pet Friendly', 'Organized', 'Vegan'],
  budget_min: 1200,
  budget_max: 1800,
  move_in_date: '2026-05-01',
  preferred_gender: 'Female',
  photos: [
    'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  ]
};

export default function ProfilePage({ params }: { params: { id: string } }) {
  // In a real implementation, we would fetch the profile from Supabase using the ID
  // For now, we use the mock profile
  return <ProfileDetails profile={{ ...MOCK_PROFILE, id: params.id }} />;
}
