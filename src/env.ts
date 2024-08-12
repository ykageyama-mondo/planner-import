import dotenv from 'dotenv'

dotenv.config()

export const env = {
  API_KEY: process.env.API_KEY!,
  TOKEN: process.env.TOKEN!,
  BOARD_ID: process.env.BOARD_ID!,
  KEEP_DONE: process.env.KEEP_DONE === 'true',
  PLANNER_OIDC: process.env.PLANNER_OIDC!,
  PLANNER_ROUTE_HINT: process.env.PLANNER_ROUTE_HINT!,
  PLANNER_TENANT: process.env.PLANNER_TENANT!,
  PLAN_ID: process.env.PLAN_ID!,
  SHAREPONT_RTFA: process.env.SHAREPONT_RTFA!,
  SHAREPOINT_FED_AUTH: process.env.SHAREPOINT_FED_AUTH!,
}