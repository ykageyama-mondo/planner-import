import axios, {AxiosInstance} from 'axios'

export interface Bucket {
  Title: string,
  Id: string,
}

export class PlannerClient {
  client: AxiosInstance
  constructor(planId: string, org: string, auth: {
    oidcToken: string,
    routeHint: string,
  }) {
    this.client = axios.create({
      baseURL: `https://tasks.office.com/${org}/TasksApiV1`,
      headers: {
        Cookie: `PlannerRouteHint=${auth.routeHint}; plannerauth-oidc=${auth.oidcToken};`
      },
      params: {
        planId
      }
    })
  }

  async getPlan() {
    return this.client.get<{
      Details: {
        Categories: string[]
      },
      Plan: {
        Title: string,
        TotalBuckets: number,
        TotalTasks: number
      }
    }>('GetPlan')
  }

  async getTasks() {
    return this.client.get<{
      Results: Array<{
        Task: {
          Title: string,
          BucketId: string,
          CompletedDate: string | null,
          AppliedCategories: string[],
        },
        Details: {
          Description: string,
          Checklist: Record<string, {IsChecked: boolean,Title: string,}>,
        }
      }>
    }>('GetTasksForPlan')
  }

  /**
   * Returns list of buckets in reverse order
   */
  async getBuckets() {
    return this.client.get<{Results: Array<{Bucket: Bucket}>}>('GetBucketsInPlan')
  }
}