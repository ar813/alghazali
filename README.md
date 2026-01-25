## Al Ghazali School Management System

Next.js + TypeScript based school management system integrated with Sanity CMS and Tailwind CSS. It includes Admin Panel, Student Portal, dynamic Notices/Events, Quizzes and Results, ID Card generation, Reports, and Parent/Guardian Search functionality.

## Tech Stack
- Next.js (App Router) with TypeScript
- Sanity CMS (Content and data)
- Tailwind CSS (UI)
- ExcelJS, FileSaver (exports)
- jsPDF (reports/cards)
- Nodemailer (email from notices)

## Setup
1) Environment variables: create `.env.local` using the keys below (see also `.env.example`)

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=your_sanity_token
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_pass
```

2) Install deps and run
```
npm i
npm run dev
```
App runs at http://localhost:3000

## Project Structure (key parts)
- `components/AdminDashboard/AdminDashboard.tsx`: Admin overview cards and quick actions
- `components/AdminResults/AdminResults.tsx`: Manage/announce results, view/export results, detailed popup
- `components/AdminCards/AdminCards.tsx`: Generate student ID cards (PDFs) with QR and exact layout
- `components/StudentDashboard/StudentDashboard.tsx`: Student overview: quizzes, announced results, recent notice
- `components/StudentResults/StudentResults.tsx`: Student side results with detailed popup
- `components/HeroSection/HeroSection.tsx`: Homepage hero with headline ticker and full-screen popup
- `app/search/page.tsx`: Parent/guardian search functionality for student information
- `app/api/*`: Backend routes (quizzes, quiz-results, notices, schedule, etc.)
- `sanity/schemaTypes/*`: Sanity datasets and schema (e.g., quizResult)

## Admin Panel Sections (summary)
- Results Control and Results: select quiz, announce/hide results, view table, open detailed popup, export to Excel/CSV
- Cards (ID Cards): select students, preview layout, generate PDFs in ZIP
- Notices: create notices and events; optional emails sent via Nodemailer
- Dashboard: statistics (Total Students, Admission Range, Total Quizzes, Announced Results), Quick Actions, Health

## Student Portal Sections (summary)
- Dashboard: available quizzes count, announced results count, total notices; Recent Quizzes/Results; Recent Notice
- Results: list of announced results; per-result popup includes question-wise details

## Features and Behaviors
- Quiz result popup: shows student metadata, score, percentage, grade, submitted time (12-hour format) and question-wise details with ✔ (correct) and ✘ (chosen)
- Attempted Students lists: class-wise position computed and shown (Admin Results as a separate right section; Student Results alongside when a result is selected)
- Hero Headline: notice title + animated content fetched from `/api/notices`; click to open a full-screen modal showing that content
- Exports: Excel/CSV for results; jsPDF for reports/cards
- Parent/Guardian Search: Secure search functionality allowing parents to find their children's information using CNIC/B-Form and GR number

## Admin → Student Mapping
- Admin Results → Student Results
  - When admin announces results (`AdminResults`), only then students see those results in `StudentResults` and `StudentDashboard` (Announced Results)
  - Class-wise position calculated similarly on both sides for consistency

- Admin Notices → Home Hero + Student Dashboard
  - Latest notice headline and content power the homepage hero headline ticker and its full-screen popup
  - Student Dashboard “Recent Notice” shows the most recent notice with content

- Admin Cards → Student Identity Cards

Under `app/api/`:
- `/api/students`: create, patch, delete (single/by class/bulk with reference checks).
- `/api/quizzes`, `/api/quiz-results`, `/api/results`, `/api/exam-results`, `/api/student-exam-results`: manage quizzes and both quiz/exam results.
- `/api/notices`, `/api/important`: manage notices/events and related feeds.
- `/api/schedule`: weekly schedule per class.
- `/api/fees`: fee records.
- `/api/upload`: uploads.
- `/api/stats`: counts and aggregates for dashboard.
- `/api/health`: environment and connectivity diagnostics.
- `/api/contact`: contact form receiver.

Most responses are `{ ok: boolean, ... }` and include meaningful HTTP status codes.

## 11. UI Components (Key Pages)

Public Home (`app/page.tsx`) includes `NavBar`, `HeroSection`, `SchoolEvents`, `About`, `AcademicPrograms`, `Faculty`, `StatsSection`, `AdmissionDetail`, `Contact`, `Footer`.
`HeroSection` displays the latest notice headline with a full-screen modal. `SchoolEvents` reads event-type notices dynamically.

## 12. Data Flow

Example: Quiz results visibility
1) Admin creates quiz -> stored in Sanity.
2) Students attempt -> submissions stored as `quizResult` via API.
3) Admin announces results -> sets `quiz.resultsAnnounced = true`.

## 13. PDF, Excel, and Email

- PDFs: jsPDF generates ID cards and student reports with accurate layout.
- Excel: ExcelJS creates styled spreadsheets for exports.
- ZIP: JSZip bundles multiple PDFs.  
  99→- Email: Nodemailer sends notice/event emails.
  100→
  101→## 14. Modules: Schedule, fees, Results, Cards, Reports, Notices
  102→
  103→- Schedule: class-day-period, shown in Student Portal.
  104→- fees: track payment status and amounts.
  105→- Quiz Results: review, announce, export, and detailed question-wise view.
- Exam Results: bulk edit all results, update exam settings, export/import, marksheet PDFs.
- Cards: generate official student ID cards.
- Reports: generate branded student PDFs.
- Notices/Events: display on homepage hero ticker and student dashboards; can send emails.

{{ ... }}

1) Open Student Portal.
2) Check Dashboard for counts and recent items.
3) View Results for quiz/exam outcomes and download PDFs.
4) Read Notices and check Schedule.
5) View Profile for personal details.

## 16. Security & Sessions

- Admin login: popup in `app/admin/page.tsx`, credentials configurable via env vars.
- Session persistence: 30 minutes stored in `localStorage`.
- Server-only writes: use `SANITY_API_WRITE_TOKEN` on server-side routes.

## 17. Error Handling & Health Checks

- Use `/api/health` to debug missing environment variables and Sanity connectivity.
- Components include loading and error states with clear messages.

## 18. Deployment

1) Configure all env vars in hosting.
2) Build the app:
```
npm run build
```
3) Deploy (e.g., Vercel) and verify Sanity credentials.

## 19. Development Guide

Scripts:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

Code style:
- Use TypeScript types in `types/`.
- Keep components small and reusable.
- Use Tailwind utilities consistently.

## 20. Troubleshooting

- Admin Results fetch issues: check `/api/health`.
- Emails failing: verify `EMAIL_USER`/`EMAIL_PASS` and SMTP settings.
- PDF alignment: remember jsPDF has top-down Y-axis.
- Missing data: confirm projectId/dataset/token.

## 21. FAQ

- Why can’t students see results? Results must be announced by admin.
- How to change admin credentials? Set `NEXT_PUBLIC_ADMIN_*` env vars.
- Where is data stored? In Sanity documents per schema.

## 22. Glossary

- Announced Results: results visible to students.
- Exam Result Set: group of subjects/marks per exam.
- Notice Event: notice with `isEvent` and date/type.

## 23. Contribution Guide

1) Fork and create a feature branch.
2) Follow TypeScript + Tailwind best practices.
3) Open PR with description and screenshots for UI.

## 24. License

Proprietary. All rights reserved by Al Ghazali High School and contributors (adjust as needed).

## 25. roadmap

- Role-based auth (admin/teacher/student).
- Bulk import for students and results.
- Analytics dashboards and trend charts.
- SMS/WhatsApp notifications integration.
