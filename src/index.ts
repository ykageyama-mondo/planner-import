import {env} from './env'
import {importPlan, Card} from './import'
import {Color, TrelloClient} from './trello'
import {PlannerClient} from './planner'

const trelloClient = new TrelloClient({
  boardId: env.BOARD_ID,
  auth: {
    apiKey: env.API_KEY,
    token: env.TOKEN
  }
})

const plannerClient = new PlannerClient(env.PLAN_ID, env.PLANNER_ORG, {
  oidcToken: env.PLANNER_OIDC,
  routeHint: env.PLANNER_ROUTE_HINT
})

async function  main() {
  const plan = await importPlan(plannerClient)
  const listLookup: Record<string, string> = {}

  for (const list of plan.lists) {
    const {id} = await trelloClient.createList(list)
    listLookup[list] = id
  }

  const listGroups = plan.tasks.reduce((agg, v): Record<string, Card[]> => {
    agg[v.listName] ??= []

    agg[v.listName].push(v)
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
  for (const listName in listGroups) {
    const listId = listLookup[listName]

    const cards = listGroups[listName]

    await Promise.all(cards.map(async card => {
      const labels = card.labels.map(label => labelMap.get(label)!)

      const {id: cardId} = await trelloClient.createCard(listId, {...card, labels})

      if (card.checklist.length) {
        await trelloClient.createChecklist(cardId, 'Checklist', card.checklist)
      }
    }))

  }
}

main()