import axios, {AxiosInstance} from 'axios'
import {RateLimiter} from 'limiter'
import {Attachment, Card, ChecklistItem} from './import'

interface Props {
  boardId: string,
  auth: {
    apiKey: string,
    token: string
  }
}
export enum Color {
  Yellow = 'yellow',
  Purple = 'purple',
  Blue = 'blue',
  // Red = 'red', // red is scary
  Green = 'green',
  Orange = 'orange',
  Black = 'black',
  Sky = 'sky',
  Pink = 'pink',
  Lime = 'lime'
}
export class TrelloClient {
  client: AxiosInstance
  boardId: string
  limiter: RateLimiter
  constructor(props: Props) {
    this.client = axios.create({
      baseURL: 'https://api.trello.com/1',
      params: {
        key: props.auth.apiKey,
        token: props.auth.token
      }
    })
    this.limiter = new RateLimiter({
      tokensPerInterval: 50,
      interval: 10 * 1000
    })
    this.boardId = props.boardId
  }

  /**
   * Creates list at the start of the board
   */
  async createList(name: string) {
    return this.post<{id: string}>('/lists', {
      name,
      idBoard: this.boardId
    })
  }

  async createCard(listId: string, card: Card) {
    return this.post<{id: string}>('/cards', {
      name: card.name,
      desc: card.description,
      idList: listId,
      idLabels: card.labels,
    })
  }

  async createChecklist(cardId: string, name: string, items: ChecklistItem[]) {
    const {id} = await this.post<{id: string}>('/checklists', {
      idCard: cardId,
      name
    })

    await Promise.all(items.map(async item =>
      this.post('/checklists/' + id + '/checkItems', {
        name: item.title,
        checked: item.isChecked
      })
    ))
  }

  async createAttachments(cardId: string, attachments: Array<Attachment>) {
    await Promise.all(attachments.map(async attachment =>
      this.post('/cards/' + cardId + '/attachments', {
        url: attachment.url,
        name: attachment.name
      })
    ))
  }

  async createLabel(name: string, color: Color) {
    return this.post<{id: string}>('labels', {
      name,
      color,
      idBoard: this.boardId
    })
  }

  async post<T = any>(...args: Parameters<AxiosInstance['post']>) {
    return withRetry(async () => {
      await this.limiter.removeTokens(1)
      return  (await this.client.post<T>(...args)).data
    })
  }
}

const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) {
      throw error
    }
    return withRetry(fn, retries - 1)
  }
}