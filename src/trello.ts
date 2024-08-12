import axios, {AxiosInstance, isAxiosError} from 'axios'
import {RateLimiter} from 'limiter'
import {Attachment, Card, ChecklistItem} from './import'
import mime from 'mime'
import fs from 'fs'
import {randomUUID} from 'crypto'
import path from 'path'
import {SharepointClient} from './sharepoint'
interface Props {
  boardId: string,
  auth: {
    apiKey: string,
    token: string
  },
  sharepointClient: SharepointClient
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
const tmpDir = '.tmp'
export class TrelloClient {
  client: AxiosInstance
  sharepointClient: SharepointClient
  boardId: string
  limiter: RateLimiter
  constructor(props: Props) {
    this.client = axios.create({
      baseURL: 'https://api.trello.com/1',
      params: {
        key: props.auth.apiKey,
        token: props.auth.token
      },
      timeout: 10_000,
    })
    this.sharepointClient = props.sharepointClient
    this.limiter = new RateLimiter({
      tokensPerInterval: 50,
      interval: 10 * 1000
    })
    this.boardId = props.boardId

    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, {recursive: true})
    }
    fs.mkdirSync(tmpDir)
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
    await Promise.all(attachments.map(async attachment => {
      const body = {
        name: attachment.name,
        url: attachment.url,
        setCover: 'false'
      } as Record<string, any>
      try {
        if (SharepointClient.isSharepointUrl(attachment.url)) {
          const {
            mimeType,
            fpath
          } = await withRetry(async () => {
            const response = await this.sharepointClient.getFile(attachment.url)
            const data = response.data
            const ext = mime.getExtension(response.headers['content-type'] || '')
            const loc = path.join(tmpDir, `${randomUUID()}.${ext}`) // random file name to prevent naming clashes during concurrent requests
            fs.writeFileSync(loc, data, 'binary')
            const mimeType = response.headers['content-type']
            if (!mimeType || !ext) {
              throw new Error(`Failed to get attachment for cardId ${cardId}. Unknown mime type for ${loc}`)
            }
            return {
              mimeType,
              fpath: loc
            }
          }, 1)
          body.mimeType = mimeType
          body.file = fs.createReadStream(fpath)
          body.setCover = attachment.setCover ? 'true' : 'false'
        }
        await this.post('/cards/' + cardId + '/attachments', body, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } catch (error) {
        delete body.file
        delete body.mimeType
        body.setCover = 'false'
        await this.post('/cards/' + cardId + '/attachments', body, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        throw new Error('Failed to upload attachment from saved file. Reverted to URL attachment')
      }
    }))
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

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 100): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) {
      if (isAxiosError(error)) {
        throw new Error(`Failed to make request. ${error.name} ${error.message} ${error.code} ${error.cause}`)
      }
      throw error
    }
    await new Promise(resolve => setTimeout(resolve, delay))
    return withRetry(fn, retries - 1)
  }
}