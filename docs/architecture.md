# Architecture

## Main workflow

1. A client submits a lead through a form or webhook.
2. The backend validates the input.
3. PostgreSQL stores the lead.
4. The lead receives a priority and category.
5. A notification is sent to the responsible user.
6. A follow-up task is created.
7. The dashboard displays the lead and its current status.

## Components

- Backend: Node.js and Express.js
- Database: PostgreSQL
- Frontend: React
- Automation: n8n
- Optional AI layer: lead classification
- Notification layer: email or Telegram

## First version scope

The first version will support:

- Lead creation
- Lead listing
- Lead status updates
- Priority and category fields
- Follow-up dates
- Basic dashboard statistics