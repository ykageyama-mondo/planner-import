import axios, {AxiosInstance} from 'axios'

export interface Bucket {
  Title: string,
  Id: string,
  OrderHint: string,
}

export class PlannerClient {
  client: AxiosInstance
  constructor(planId: string, tenant: string, auth: {
    oidcToken: string,
    routeHint: string,
  }) {
    this.client = axios.create({
      baseURL: `https://tasks.office.com/${tenant}/TasksApiV1`,
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
        BucketTaskBoardFormat: {
          OrderHint: string
        },
        Task: {
          Title: string,
          BucketId: string,
          CompletedDate: string | null,
          AppliedCategories: string[],
        },
        Details: {
          Description: string,
          Checklist: Record<string, {IsChecked: boolean,Title: string, OrderHint: string,}>,
          References: Record<string, {
            Alias: string,
            PreviewPriority: string,
          }>
        }
      }>
    }>('GetTasksForPlan')
  }

  async getBuckets() {
    return this.client.get<{Results: Array<{Bucket: Bucket}>}>('GetBucketsInPlan')
  }
}