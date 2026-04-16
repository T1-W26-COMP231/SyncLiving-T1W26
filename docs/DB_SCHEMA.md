# DB_SCHEMA.md - Database Schema & RLS Policies

This document serves as the comprehensive guide for the SyncLiving database schema.

## 1. Core Tables

### **`public.profiles`**
Linked to Supabase Auth (`auth.users`).
- **Columns:** `id` (PK, UUID), `full_name` (Text), `avatar_url` (Text), `age` (Int), `location` (Text), `location_coords` (Geography), `role` (seeker/provider), `lifestyle_tags` (text[]), `budget_min/max` (Int), `is_admin` (Bool), `account_status` (Text), `email` (Text).

### **`public.room_listings`**
Managed by Room Providers.
- **Columns:** `id` (PK), `provider_id` (FK), `title` (Text), `description` (Text), `price` (Int), `status` (active/paused/archived), `location_coords` (Geography), `images` (text[]).

### **`public.conversations`**
A direct messaging container between two users.
- **Columns:** `id` (PK), `seeker_id` (FK), `provider_id` (FK), `listing_id` (FK, nullable), `created_at`.

### **`public.messages`**
The content of a conversation.
- **Columns:** `id` (PK), `conversation_id` (FK), `sender_id` (FK), `content` (Text), `is_read` (Bool), `created_at`.

### **`public.match_requests`**
Initial outreach between seeker and provider.
- **Columns:** `id` (PK), `sender_id`, `receiver_id`, `status` (pending/accepted/declined).

## 2. Platform Features

### **`public.reviews` & `public.review_requests`**
User rating and feedback system.
- Includes overall rating, specific dimension ratings, and status (including soft deletion).

### **`public.match_feedback`**
Feedback regarding the quality of algorithmic matches (thumbs up/down and reasons).

### **`public.support_tickets` & `public.support_messages`**
Customer support system allowing users to contact admins for help. Users can view their own, admins manage all.

### **`public.announcements`**
System-wide news broadcasted by administrators to all authenticated users.

## 3. Security & Moderation Tables

### **`public.admin_alerts` & `public.user_activity_logs`**
Automated alerts and extensive tracking of user actions for audit purposes.

### **`public.user_reports` & `public.message_reports`**
Explicit user reports submitted for moderation, either for profiles/listings or specific chat messages.

### **`public.sensitive_keywords`**
Keywords that trigger security alerts when detected in user-generated content.

## 4. RLS Policies (Crucial)
**Rule:** Every new table MUST have Row Level Security enabled.

### **General Access Patterns:**
- **Admins:** Have a special policy `is_admin = true` that allows them to `SELECT/INSERT/UPDATE/DELETE` on system tables (alerts, keywords, reports, announcements, support tickets).
- **Users:**
  - Can only `SELECT/UPDATE` their own profile data.
  - Can only `SELECT/INSERT` messages in conversations where they are a participant.
  - Can only `INSERT` reports, match requests, or support tickets.
  - Can only `SELECT` global active data (like active room listings or announcements).

## 5. Geographic Data
SyncLiving uses **PostGIS** (`geography` type) for location-based search.
- Use `ST_DWithin` for distance-based filtering.
- Coordinates are stored as `Point(longitude, latitude)`.

## 6. Type Generation
Run the following command after any migration:
`npx supabase gen types typescript --local > src/types/supabase.ts`
