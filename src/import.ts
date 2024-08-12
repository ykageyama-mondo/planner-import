import {PlannerClient} from './planner'

export interface ChecklistItem {
  title: string;
  isChecked: boolean;
}
export interface Attachment {
  name: string,
  url: string,
  setCover: boolean,
}
export interface BaseCard {
  name: string,
  checklist: ChecklistItem[],
  labels: string[],
  description: string,
  attachments: Array<Attachment>
}

export interface Card extends BaseCard{
  listId: string,
}
export interface PlannerCard extends BaseCard{
  bucketId: string,
}
export async function importPlan(client: PlannerClient, keepDone: boolean) {

  const [plan, buckets, tasks] = await Promise.all([
    client.getPlan(),
    client.getBuckets(),
    client.getTasks(),
  ])

  const categoryLookup = plan.data.Details.Categories

  const parsedTasks = tasks.data.Results.sort((a, b) =>
    orderHintSort(a.BucketTaskBoardFormat.OrderHint, b.BucketTaskBoardFormat.OrderHint)
  ).map((v): PlannerCard | undefined => {
    const labels = v.Task.AppliedCategories ? v.Task.AppliedCategories.map(v => categoryLookup[v]) : []

    if (!keepDone && v.Task.CompletedDate) {
      return
    }

    if (v.Task.CompletedDate) {
      labels.push('Done')
    }

    return {
      name: v.Task.Title,
      bucketId: v.Task.BucketId,
      description: v.Details.Description,
      checklist: Object.values(v.Details.Checklist).sort((a, b) =>
        orderHintSort(b.OrderHint, a.OrderHint)
      ).map(v => ({
        title: v.Title,
        isChecked: v.IsChecked
      })),
      labels,
      attachments: Object.entries(v.Details.References).map(([url, {Alias, PreviewPriority}]) => ({
        url,
        name: Alias,
        setCover: PreviewPriority.length > 3
      }))
    }
  }).filter((x): x is PlannerCard => Boolean(x))
  return {
    buckets: buckets.data.Results
      .sort((a, b) => orderHintSort(a.Bucket.OrderHint, b.Bucket.OrderHint))
      .map(v => ({
        id: v.Bucket.Id,
        name: v.Bucket.Title
      })),
    tasks: parsedTasks
  }
}

// Sort by descending order hint https://learn.microsoft.com/en-us/graph/api/resources/planner-order-hint-format?view=graph-rest-1.0
function orderHintSort(a: string, b: string) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) {
      continue
    }
    return a.charCodeAt(i) - b.charCodeAt(i)
  }

  return 0
}