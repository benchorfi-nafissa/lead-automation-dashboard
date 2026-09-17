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

## Database model

### users

Stores dashboard users and their roles.

### leads

Stores customer or business leads, their status, priority, category and assignment.

### lead_events

Stores the history of actions and status changes related to a lead.

### followups

Stores scheduled follow-up tasks and their completion status.

## Data relationships

- One user can be assigned to many leads.
- One lead can have many events.
- One lead can have many follow-up tasks.
- Events and follow-ups are deleted when their lead is deleted.