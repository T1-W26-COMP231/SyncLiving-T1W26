# SyncLiving Project Overview (Extracted from Technical Report)

## 1. Introduction
SyncLiving is a specialized roommate-finding platform designed to address the challenges of shared housing. Unlike traditional rental platforms that focus primarily on property attributes like price and location, SyncLiving prioritizes **lifestyle compatibility** and **community trust**. The system is built to bridge the information gap in the rental market by shifting from a property-centric search model to a people-centric compatibility model.

### Core Mechanisms
*   **Lifestyle Compatibility Scoring:** An algorithm that calculates match percentages based on standardized lifestyle tags (e.g., #EarlyRiser, #QuietHours).
*   **Trust Indicators:** A reputation system built on peer-reviewed feedback from previous co-living arrangements.
*   **Secure Interaction:** A mutual-consent messaging system that protects user privacy until compatibility is confirmed by both parties.

---

## 2. Description of User Roles and Persona

### User Roles
The SyncLiving ecosystem is structured around four primary user roles:

| Role | Frequency of Use | Expertise | Primary Goal |
| :--- | :--- | :--- | :--- |
| **Room Seeker** | High (Daily) | Low to Moderate | Find a compatible roommate and a living space with minimal conflict. |
| **Room Provider** | Medium (When vacant) | Moderate | Find reliable, compatible tenants for available rooms. |
| **Administrator** | Low (Internal) | High | Ensure platform safety, manage disputes, and maintain system integrity. |
| **Reviewer** | Occasional | Moderate | Provide feedback on past living experiences to maintain trust scores. |

### Persona: The Young Professional
*   **Name:** Michael, 24.
*   **Background:** Recent graduate moving to a new city for work.
*   **Goals:** Finds a quiet environment for remote work; needs a roommate who doesn't smoke.
*   **Pain Point:** Overwhelmed by random listings on Facebook Marketplace where lifestyles are unknown.

---

## 3. User Stories (Priority 1: Must-Haves)

### For Room Seekers
1.  **Create Profile:** As a Room Seeker, I want to create a profile with my lifestyle preferences so that I can be matched with compatible roommates.
2.  **Compatibility Search:** As a Room Seeker, I want to search for rooms based on a compatibility score so that I don't waste time on mismatched lifestyles.
3.  **Secure Messaging:** As a Room Seeker, I want to message potential roommates only after a mutual match is confirmed to protect my privacy.

### For Room Providers
1.  **Post Listing:** As a Room Provider, I want to create a room listing with specific house rules so that applicants know my expectations upfront.
2.  **Screen Applicants:** As a Room Provider, I want to view the compatibility profiles of applicants to select the best fit for the household.

---

## 4. Iteration Plan

### Iteration 1: Foundation & Authentication
**Objective:** Set up the core technical architecture and user entry points.
*   **Environment Setup:** Initialize Next.js 15, Supabase project, and Tailwind CSS.
*   **Authentication Flow:** Implement secure Sign-up/Login using Supabase Auth (Email & Social).
*   **User Profiles (Basic):** Develop the initial data schema for user profiles including basic bio and contact info.
*   **Database Migrations:** Establish core tables: `users`, `profiles`, and `listings`.

### Iteration 2: Core Matching & Listings
**Objective:** Deliver the primary value proposition of the platform.
*   **Lifestyle Tagging System:** Build the UI for users to select and display lifestyle tags.
*   **Room Listing Engine:** Develop the "Create Listing" workflow for Room Providers, including image uploads via Supabase Storage.
*   **Matching Algorithm (V1):** Implement the server-side logic to calculate compatibility scores based on tag overlap.
*   **Search & Discovery:** Build the main dashboard where Room Seekers can filter and view matched listings.

---

## 5. Technology Stack
*   **Framework:** Next.js (App Router)
*   **Database & Auth:** Supabase (PostgreSQL)
*   **Styling:** Tailwind CSS
*   **Language:** TypeScript
