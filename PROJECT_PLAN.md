# Institute Management Platform

This repository contains a training institute management platform for B.Tech students, with a public website and role-based admin, trainer, and student portals.

## Project overview

The institute offers six technical training courses:

1. Python Full Stack (PFS), 5 months
2. Java Full Stack (JFS), 5 months
3. Core Python (PYCORE), 3 months
4. Core Java (JCORE), 3 months
5. Data Analytics (DA), 4 months
6. Front-End Development (FED), 3 months

The platform has four parts:

| Part | Purpose | Users |
|---|---|---|
| Public Website | Marketing, course information, and enquiry collection | Everyone |
| Admin Portal | Run the institute, including admissions and operations | Admin, Counsellor |
| Trainer Portal | Classes, attendance, and evaluation | Trainer |
| Student Portal | Learning, assignments, and payments | Student |

Use one common login page and redirect users based on their role: Admin and Counsellor to the Admin Portal, Trainer to the Trainer Portal, and Student to the Student Portal. Do not create separate login systems.

## Roles and permissions

| Role | Access |
|---|---|
| Admin | Full access, including settings, fees, reports, audit logs, and student account editing, activation/blocking, and archiving |
| Counsellor | Leads, enquiries, student registration, and read access to courses and batches; no student account editing or activation/blocking/archiving; no fees, financial reports, settings, or audit logs |
| Trainer | Assigned batches and their students only; attendance, class materials, assignments, and evaluation. No fees, settings, or access to other trainers' data |
| Student | Their own profile, enrolments, learning materials, assignments, attendance, evaluations, certificates, and fee records only |

Enforce these permissions in the backend API and scope each list/detail queryset to the signed-in user's role and assignments. Frontend navigation and route guards should reflect the same access rules.

## Business rules

These are the initial defaults. Keep configurable values in environment/settings, and keep course-specific values editable through course records.

| Decision | Default |
|---|---|
| Institute name | `INSTITUTE_NAME`, default `JK IT SOLUTIONS` |
| Course catalog | PFS and JFS: ₹6,999 each; Core Python and Core Java: ₹4,999 each; Front-End Development: ₹3,999; Data Analytics: ₹6,999. Durations are 5, 5, 3, 3, 4, and 3 months respectively. |
| Class mode | Online, Offline, or Hybrid |
| Registration | Public users can submit enquiries and create email-verified Student accounts and profiles; Admin/Counsellor can create admitted student accounts. Admin can edit, block/reactivate, or archive student accounts. |
| Payments | Support instalments and manually recorded payments in Phase 1; integrate Razorpay in Phase 2 |
| Class length | 2 hours |
| Weekday slots | 6:30 PM–8:30 PM or 7:00 PM–9:00 PM |
| Weekend slots | 9:00–11:00 AM, 2:00–4:00 PM, or 5:00–7:00 PM |
| Learning balance | 30% theory and 70% practical |

Recommended two-hour class structure: 15 minutes revision, 45 minutes concept instruction, 10 minutes break, 40 minutes practical work, and 10 minutes for doubts/assignment.

## Scope

### Phase 1
1. Repo and environment setup
2. Backend skeleton with Django + DRF
3. Accounts app: custom User + JWT auth + role permissions
4. Courses app with CRUD and seed data
5. Students app with profile and exports
6. Batches app with enrolment logic and weekly schedule
7. Leads app with enquiry capture and conversion flow
8. Dashboard summary endpoint
9. Frontend skeleton with Vite + Tailwind + role layout
10. Login/auth screens
11. Public pages
12. Admin dashboard and management screens
13. Security hardening and QA

### Phase 2+
- Razorpay integration and payment automation
- Further enhancements to trainers, attendance, fees, learning, assessments, certificates, reports, notifications, and colleges

## Stack
- Frontend: React 18 + Vite + TypeScript + Tailwind
- Backend: Python 3.12 + Django 5 + DRF
- Auth: JWT + role-based permission classes
- DB: PostgreSQL 16
- API docs: drf-spectacular
- Testing: pytest + pytest-django + Vitest

## Repository structure
- Keep Django configuration and each backend domain app under `backend/`.
- Keep the frontend under `frontend/`, with shared API clients in `src/api/`, reusable UI and layout components in `src/components/`, and role-specific shells in `src/layouts/`.
- Keep route definitions and access guards in `src/routes/`, authentication state in `src/store/`, and shared helpers in `src/lib/`.
- Organize frontend screens, hooks, and types into `src/features/<module>/` folders rather than growing a single application file.
- Keep the root `.env.example` for Docker Compose and provide `backend/.env.example` for local backend setup.

## Core rules
- Use a common login page with redirect based on role.
- Every queryset must be role-scoped.
- Use soft-delete patterns for historical records.
- Multistep writes should be transactional.
- Never hard-code secrets or test credentials.
