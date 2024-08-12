import {env} from './env'
import {importPlan, Card} from './import'
import {Color, TrelloClient} from './trello'
import {PlannerClient} from './planner'
import axios from 'axios'

const trelloClient = new TrelloClient({
  boardId: env.BOARD_ID,
  auth: {
    apiKey: env.API_KEY,
    token: env.TOKEN
  }
})

const plannerClient = new PlannerClient(env.PLAN_ID, env.PLANNER_TENANT, {
  oidcToken: env.PLANNER_OIDC,
  routeHint: env.PLANNER_ROUTE_HINT
})

async function  main() {
  const plan = await importPlan(plannerClient, env.KEEP_DONE)

  // bucket id to list id map
  const listLookup: Record<string, string> = {}
  for (const bucket of plan.buckets) {
    const {id} = await trelloClient.createList(bucket.name)
    listLookup[bucket.id] = id
  }

  // group tasks by list id
  const listGroups = plan.tasks.reduce((agg, {bucketId, ...rest}): Record<string, Card[]> => {
    const listId = listLookup[bucketId]

    agg[listId] ??= []

    agg[listId].push({...rest, listId: listId})
    return agg
  }, {} as Record<string, Card[]>)

  // label name to id map
  const labelMap = new Map<string, string>()

  const allLabels = Array.from(new Set(Object.values(listGroups).flat().flatMap(v => v.labels)))
  await Promise.all(allLabels.map(async (label, i) => {
    const color = label === 'Done' ? Color.Green :  Object.values(Color)[i % Object.values(Color).length]

    const {id} = await trelloClient.createLabel(label, color)
    labelMap.set(label, id)
  }))
  await Promise.all(Object.keys(listGroups).map(async listId => {
    const cards = listGroups[listId]

    for (const card of cards) {
      const labels = card.labels.map(label => labelMap.get(label)!)
      const {id: cardId} = await trelloClient.createCard(listId, {...card, labels})
      if (card.checklist.length) {
        await trelloClient.createChecklist(cardId, 'Checklist', card.checklist)
      }

      if (card.attachments.length) {
        await trelloClient.createAttachments(cardId, card.attachments)
      }
    }
  }))
}

main()