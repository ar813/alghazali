## Al Ghazali School Management System

Next.js + TypeScript based school management system integrated with Sanity CMS and Tailwind CSS. It includes Admin Panel, Student Portal, dynamic Notices/Events, Quizzes and Results, ID Card generation, and Reports.

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

## Admin → Student Mapping
- Admin Results → Student Results
  - When admin announces results (`AdminResults`), only then students see those results in `StudentResults` and `StudentDashboard` (Announced Results)
  - Class-wise position calculated similarly on both sides for consistency

- Admin Notices → Home Hero + Student Dashboard
  - Latest notice headline and content power the homepage hero headline ticker and its full-screen popup
  - Student Dashboard “Recent Notice” shows the most recent notice with content

- Admin Cards → Student Identity Cards
  - Admin prepares/export ID cards; student views not directly, but cards use the same student data (photo, name, class, roll/GR)

## Stats Logic (Admin Dashboard)
- Announced Results (30 days): count of results whose quiz has `resultsAnnounced = true` within last 30 days
- Admission Range: percentage based on Total Students vs a capacity baseline (220): `(Total Students ÷ 220) × 100%`

## Troubleshooting
- If fetching fails in Admin Results, use `/api/health` to see missing env vars or Sanity connectivity issues
- Ensure `.env.local` is present and correct; restart dev server after changes

## Contributing
Open issues or PRs describing the change. Keep code modular, typed, and consistent with Tailwind + React best practices.
