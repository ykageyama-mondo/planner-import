# Planner import tool for Trello

Tool to migrate MS Planner plan to a Trello Board.

## Limitations:

- Trello has no concept of completed cards
  - Set `KEEP_DONE` to either `true` to keep and tag completed tasks or `false` to ignore them
- Unsupported attachment types (will default to attaching via URL):
  - SVG
  - PDF

## Requirements:

- Node 20
- pnpm
- Trello API Key and Token for your target workspace([see here for details on how to get this](https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/))
- Planner Tenant and Plan Id to export from (url is in the format `https://tasks.office.com/<tenant ID>/...&planId=<plan ID>`)
- Planner OIDC Token and Route Hint (inside your browser's cookies for `https://tasks.office.com`. Look for `plannerauth-oidc` and `PlannerRouteHint`)
- The ID of the Trello board to import to (you can get this by adding `.json` to the end of the board's URL and looking for the `id` field)
- Sharepoint Auth if you have any sharepoint attachments in your tasks. Will default to attaching via URL if not provided. (inside your browser's cookies for `https://<tenant>.sharepoint.com`. Look for `rtFa` and `FedAuth`)

## Usage:

1. Clone this repository
2. Run `pnpm install`
3. Create a `.env` file at the root of the project with content in `.env.example` and fill in the values
4. Run `pnpm start`