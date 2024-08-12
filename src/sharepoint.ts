import axios, {AxiosInstance} from 'axios'

export class SharepointClient {
  static isSharepointUrl(url: string) {
    return url.includes('sharepoint.com')
  }

  client: AxiosInstance
  constructor(auth: {
    rtFa: string,
    fedAuth: string,
  }) {
    this.client = axios.create({
      responseType: 'arraybuffer',
      headers: {
        cookie: `FedAuth=${auth.fedAuth}; rtFa=${auth.rtFa}; WacDataCenterSetTime=${new Date().toISOString()}`
      },
      timeout: 10_000,
    })
  }


  async getFile(url: string) {
    return this.client.get(this.parseUrl(url))
  }

  parseUrl(url: string) {
    if (url.includes('.pdf?web=1'))
      return url.replace('.pdf?web=1', '.pdf')
    return url
  }
}