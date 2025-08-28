# Book Review Platform – Product Requirements Document (PRD)

## Overview
A minimal yet functional book review platform for Indian users, supporting user authentication, book catalog, reviews, ratings, user profiles, and AI-powered recommendations. The platform will be open source, containerized, and deployed on AWS.

## Goals
- Enable users to discover, review, and rate bestselling books.
- Provide personalized book recommendations using OpenAI APIs.
- Ensure a secure, private, and user-friendly experience.
- Support easy deployment and open source collaboration.

## Target Users
- All age groups in India interested in reading and reviewing books.
- Users seeking book recommendations and community-driven insights.

## Constraints
- Only logged-in users can access content and features.
- Limit of 20 favourite books per user.
- No social login, notifications, or gamification in MVP.
- Use Open Library API for book data; placeholder images for profiles.
- Platform must be containerized (Docker) and deployable on AWS.
- Open source with MIT license.

## Functional Requirements Table

| Requirement ID | Description | User Story | Expected Behaviour |
|---------------|-------------|------------|--------------------|
| FR001 | User Authentication (Signup/Login/Logout) | As a user, I want to sign up, log in, and log out securely using email and password. | Users can create accounts, log in, and log out. |
| FR002 | Password Reset | As a user, I want to reset my password if I forget it. | Users can request a password reset and set a new password. |
| FR003 | Book Catalog (Bestsellers) | As a user, I want to browse a list of bestselling books. | Users see a paginated list of books from Open Library API. |
| FR004 | Book Search | As a user, I want to search books by title or author. | Users can search and filter books by title/author. |
| FR005 | Book Details | As a user, I want to view detailed information about a book. | Users see book details, cover image, description, genres, and published year. |
| FR006 | Create Review | As a user, I want to write a review and rate a book. | Users can submit a review and rating (1–5) for a book. |
| FR007 | Edit/Delete Review | As a user, I want to edit or delete my own review. | Users can update or remove their reviews at any time. |
| FR008 | Rate Without Review | As a user, I want to rate a book without writing a review. | Users can submit a rating without text. |
| FR009 | One Review/Rating per Book | As a user, I can only review/rate a book once. | Users cannot submit multiple reviews/ratings for the same book. |
| FR010 | Ratings Aggregation | As a user, I want to see the average rating and total reviews for each book. | Book details show average rating (1 decimal) and review count, updated in real time. |
| FR011 | User Profile | As a user, I want to view my profile with my reviews and favourites. | Users see their reviews, favourite books (up to 20), and profile pic (placeholder). |
| FR012 | Favourites | As a user, I want to mark/unmark books as favourites. | Users can add/remove up to 20 favourite books. |
| FR013 | Private Profiles | As a user, my profile and favourites are private. | Only the user can view their own profile and favourites. |
| FR014 | Recommendations (OpenAI) | As a user, I want to get book recommendations on my dashboard. | Users see personalized recommendations using OpenAI API, configurable API key. |
| FR015 | Secure API Key Config | As an admin, I want to configure the OpenAI API key securely. | Admin can set/change the API key without code changes. |
| FR016 | Containerized Deployment | As a developer, I want to deploy the platform easily. | Platform is Dockerized and ready for AWS deployment. |
| FR017 | Open Source License | As a contributor, I want to know the licensing terms. | MIT license is included in the codebase. |

---

This PRD covers the core requirements, user stories, and expected behaviours for the MVP of the Book Review Platform. Further details can be added as the project evolves.
