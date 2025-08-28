# Book Review Platform – Technical Product Requirements Document (Technical PRD)

## Overview
This document outlines the key technical requirements and tasks for the MVP of the Book Review Platform, based on the business PRD and architectural decisions.

## Technical Goals
- Ensure secure, scalable, and maintainable architecture using React (frontend), NestJS (backend), and MongoDB.
- Support containerized deployment on AWS EC2.
- Provide robust authentication, API documentation, and local caching of book data.
- Enable rate-limited and logged integration with OpenAI API.
- Maintain code quality with unit tests, linting, and formatting.

## Constraints
- No CI/CD, monitoring, or alerting for MVP.
- No social login, notifications, or gamification.
- Only REST API with Swagger documentation and versioning.
- Data scale expected in hundreds; default page size 20 (configurable).
- User data encrypted at rest; logs centralized and structured (JSON).

## Technical Requirements Table

| Task ID | Description | User Story | Expected Behaviour |
|---------|-------------|------------|--------------------|
| T001 | Set up separate containerized React frontend and NestJS backend projects. | As a developer, I want to build and deploy frontend and backend independently. | Frontend and backend run in separate Docker containers, deployable on EC2. |
| T002 | Implement MongoDB integration for backend data storage. | As a developer, I want to persist user, book, review, and rating data. | Backend connects to MongoDB; data is stored and retrieved as needed. |
| T003 | Implement JWT authentication with short-lived access and refresh tokens. | As a user, I want secure login and session management. | Users authenticate with JWT; refresh tokens supported. |
| T004 | Enforce user data encryption at rest in MongoDB. | As a developer, I want user data to be secure. | Sensitive user data is encrypted in the database. |
| T005 | Integrate with Open Library API and cache book data locally. | As a user, I want fast access to book data. | Book data is fetched, cached, and updated periodically. |
| T006 | Implement REST API with versioning and auto-generated Swagger docs. | As a developer, I want clear, documented APIs. | All endpoints are versioned and documented with Swagger. |
| T007 | Implement configurable pagination (default 20) for book and review listings. | As a user, I want to browse data in pages. | Listings are paginated; page size is configurable. |
| T008 | Implement simple search (SQL-like) for books by title/author. | As a user, I want to search books easily. | Users can search books by title or author. |
| T009 | Integrate OpenAI API for recommendations with rate limiting and logging. | As a user, I want personalized recommendations. | Recommendations are generated, API usage is rate-limited and logged. |
| T010 | Cache recommendations per user; fallback to default list if OpenAI is unavailable. | As a user, I want recommendations even if AI is down. | Cached or default recommendations are shown as needed. |
| T011 | Centralize and structure logs in JSON format. | As a developer, I want easy log analysis. | All logs are structured and centralized. |
| T012 | Implement unit tests with coverage reports for backend and frontend. | As a developer, I want to ensure code quality. | Unit tests exist with coverage reports. |
| T013 | Enforce code linting and formatting for all codebases. | As a developer, I want consistent code style. | Linting and formatting are part of the workflow. |
| T014 | Support secure configuration of OpenAI API key (no hardcoding). | As an admin, I want to manage API keys securely. | API key is set via environment/config, not code. |
| T015 | Provide Docker Compose for local development and deployment. | As a developer, I want easy setup and deployment. | Docker Compose file sets up frontend, backend, and MongoDB. |

---

This technical PRD defines the core technical tasks and requirements for the MVP. Further technical details and refinements can be added as the project evolves.
