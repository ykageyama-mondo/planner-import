import dotenv from 'dotenv'

dotenv.config()

export const env = {
  API_KEY: process.env.API_KEY!,
  TOKEN: process.env.TOKEN!,
  BOARD_ID: process.env.BOARD_ID!,
  PLANNER_OIDC: process.env.PLANNER_OIDC!,
  PLANNER_ROUTE_HINT: process.env.PLANNER_ROUTE_HINT!,
  PLANNER_ORG: process.env.PLANNER_ORG!,
  PLAN_ID: process.env.PLAN_ID!
}