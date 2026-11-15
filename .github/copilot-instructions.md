Project: Institute Management Platform. Read PROJECT_PLAN.md before generating code.
![alt text](<Screenshot 2026-11-04 180640.png>)
General
- Follow the folder structure, models, endpoints and roles in PROJECT_PLAN.md exactly.
- Build one module at a time and keep the scope focused.
- Prefer readable, small functions and type-safe code.
- Every new endpoint should include serializer validation, permissions, and tests.

Backend (Django + DRF)
- Use ViewSets + routers, serializers, and django-filter.
- Use select_related/prefetch_related to avoid N+1 queries.
- Soft delete or archive records when appropriate.
- Use transaction.atomic() for multi-step writes.

Frontend (React + TypeScript + Tailwind)
- Use functional components and hooks only.
- Prefer TanStack Query and React Hook Form + Zod.
- Keep layouts and route guards role-aware.

Security
- Never store payment details in code or logs.
- Validate uploads and restrict access by role.
