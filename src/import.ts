import {PlannerClient} from './planner'

export interface ChecklistItem {
  title: string;
  isChecked: boolean;
}
export interface Card {
  name: string,
  listName: string,
  checklist: ChecklistItem[],
  labels: string[],
  description: string
}

export async function importPlan(client: PlannerClient) {

  const [plan, buckets, tasks] = await Promise.all([
    client.getPlan(),
    client.getBuckets(),
    client.getTasks(),
  ])

  const categoryLookup = plan.data.Details.Categories
  const bucketLookup = buckets.data.Results.reduce((agg, v) => {
    agg[v.Bucket.Id] = v.Bucket.Title
    return agg
  }, {} as Record<string, string>)

  const parsedTasks = tasks.data.Results.map((v): Card => {
    const labels = v.Task.AppliedCategories ? v.Task.AppliedCategories.map(v => categoryLookup[v]) : []

    if (v.Task.CompletedDate) {
      labels.push('Done')
    }

    return {
      name: v.Task.Title,
      listName: bucketLookup[v.Task.BucketId],
      description: v.Details.Description,
      checklist: Object.values(v.Details.Checklist).map(v => ({
        title: v.Title,
        isChecked: v.IsChecked
      })),
      labels,
    }
  })
  return {
    lists: buckets.data.Results.map(v => v.Bucket.Title),
    tasks: parsedTasks
  }
}