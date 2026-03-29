export interface ReviewTarget {
  id: string;
  name: string;
  avatarUrl: string;
  matchedTime: string;
  location: string;
  isVerified: boolean;
}

export interface HighlightTag {
  id: string;
  label: string;
  icon: string;
}

export interface ReviewDraft {
  rating: number;
  highlights: string[];
  feedback: string;
}