# Intelligent Conference Management System (CMS)

A modern, open-source Conference Management System designed to handle the complex workflows of academic publishing. Built as a university thesis project, this platform addresses the scalability and integrity crises in modern peer review by integrating a robust state-machine backend with an **AI-driven Citation Verification** pipeline.

## Key Features

- **AI-Driven Citation Verification:** Replaces brittle Regex parsing with **GROBID** (a Machine Learning microservice using Conditional Random Fields) to semantically analyze PDF layouts. It extracts structured bibliographies and automatically cross-references them against the **Crossref API** to flag invalid or fake citations.
- **Cryptographic Double-Blind Peer Review:** Features a custom backend interceptor that mathematically strips author metadata from network payloads before reaching the Reviewer dashboard, strictly enforcing academic ethics.
- **Finite State Machine (FSM) Lifecycle:** The core academic workflow (Draft ➔ Submitted ➔ Bidding ➔ Under Review ➔ Discussion ➔ Decision) is gated by a strict FSM, preventing unauthorized actions or late submissions.
- **Role-Based Access Control (RBAC):** Context-aware routing provides distinct, secure user interfaces ("Three Pillars") for **Authors**, **Reviewers**, and **Chairs**.

## Tech Stack

Built using a **3-Tier Modular Monolith Architecture** and Domain-Driven Design (DDD) principles.

**Frontend (Presentation Layer):**

- React 18 & Vite
- TypeScript
- Material UI (MUI)
- React Router & Axios

**Backend (Application Layer):**

- NestJS (Node.js framework)
- TypeScript
- Sequelize (ORM) with Active Record pattern
- JWT Authentication

**Database & AI Infrastructure:**

- MySQL (Normalized to 3NF for ACID compliance)
- Docker (Containerizing the GROBID Machine Learning microservice)

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for the AI module)
- A local MySQL server (e.g., via XAMPP, HeidiSQL, or MySQL Workbench)

### 1. Start the AI Microservice (GROBID)

The citation extraction relies on pre-trained ML models. Spin up the Docker container first:

```bash
docker run --rm -d -p 8070:8070 --name grobid lfoppiano/grobid:0.8.1
```

> Wait ~30 seconds for the models to load into memory. You can verify it is running by hitting [http://localhost:8070/api/isalive](http://localhost:8070/api/isalive) in your browser.

### 2. Database Setup

- Open your MySQL client.
- Create a new, empty database named `conference_management` (or your preferred name).
- Update the database credentials in the backend's `.env` file or `app.module.ts` configuration.

### 3. Backend Setup

Navigate to the backend directory, install dependencies, and start the NestJS server.

```bash
cd backend
npm install
npm run start:dev
```

> Sequelize will automatically synchronize your models and create the necessary SQL tables.

### 4. Frontend Setup

Open a new terminal, navigate to the frontend directory, install dependencies, and start the Vite development server.

```bash
cd frontend
npm install
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

---

## Workflow / Usage Overview (subject to change)

- **The Author:** Uploads an academic PDF. The backend immediately routes the file to the GROBID microservice for semantic layout analysis, validates the references via Crossref, and saves the AI confidence scores.

- **The Chair:** Logs in to view a comprehensive grid of all submissions. The Chair can review the generated Citation Verification Report (seeing verified vs. flagged references) and push the paper to the "Under Review" state.

- **The Reviewer:** Logs in to evaluate assigned papers. All Author metadata is completely stripped from the UI and network requests. The Reviewer inputs numerical scores and textual feedback.

---

## License & Academic Context

This project was developed by **Alexandru-David Dumitru** as a Bachelor's Thesis for the Faculty of Cybernetics, Statistics and Economic Informatics at the Bucharest University of Economic Studies.

**Scientific Coordinator:** Prof. univ. dr. Cristian TOMA.
