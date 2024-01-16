import axios from 'axios'
import html2md from 'html-to-md'
import FormData from 'form-data'

var TurndownService = require('turndown')
var turndownPluginGfm = require('turndown-plugin-gfm')

var gfm = turndownPluginGfm.gfm
var turndownService = new TurndownService()
turndownService.use(gfm)

const html2mdOptions = {
  ignoreTags: [
    '',
    'style',
    'head',
    '!doctype',
    'form',
    'svg',
    'noscript',
    'script',
    'meta',
    'footer',
  ],
  skipTags: [
    'div',
    'html',
    'body',
    'nav',
    'section',
    'footer',
    'main',
    'aside',
    'article',
    'header',
    'label',
  ],
  emptyTags: [],
  aliasTags: {
    figure: 'p',
    dl: 'p',
    dd: 'p',
    dt: 'p',
    figcaption: 'p',
  },
  renderCustomTags: 'SKIP', //true,
}

/* Function to upload to KB */
async function executePostRequest(filename, doc, apiKey, projectID, callback) {
  let form = new FormData()

  form.append('file', doc, { filename: filename })
  form.append('canEdit', 'true')

  let config = {
    method: 'post',
    url: 'https://api.voiceflow.com/v3/projects/65652b1da1e7a600072c367f/knowledge-base/documents/file',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': `multipart/form-data; boundary=${form.getBoundary()}`,
      cookie:
        'auth_vf=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjM2MDAsImVtYWlsIjoibmljb2xhcy5hcmNheUB2b2ljZWZsb3cuY29tIiwibmFtZSI6Ik5pY29sYXMgQXJjYXkgQmVybWVqbyIsImludGVybmFsQWRtaW4iOnRydWUsImlzcyI6Imh0dHBzOi8vYXV0aC1hcGkudm9pY2VmbG93LmNvbSIsImlhdCI6MTcwNTM0MDE1NH0.okDvpLOiDxwfuRvQ_J_xECoQGZlJb0H1IFbl_o98tjA;',
      ...form.getHeaders(),
    },
    data: form,
  }

  return axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data))
      return response.data
    })
    .catch(function (error) {
      console.log(error)
    })
}

export const Scrapper = {
  parse: async function (url, cache, format, engine, set) {
    let outputFormat = format || 'text'
    let useCache = cache || 'yes'
    let mkEngine = engine || 'html2md'

    if (useCache != 'no' && useCache != 'false' && useCache != false) {
      useCache = 'yes'
    } else {
      useCache = 'no'
    }

    if (outputFormat != 'mrkdown' && outputFormat != 'markdown') {
      outputFormat = 'text'
    } else {
      outputFormat = 'mrkdown'
    }

    return axios
      .get(
        `http://127.0.0.1:${Bun.env.SCRAPPER_PORT}/api/article?url=${url}&cache=${useCache}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(function (response) {
        if (response.data.textContent || response.data.fullContent) {
          let doc = {
            title: response.data.title,
            url: response.data.url,
          }
          if (response.data.excerpt) {
            if (outputFormat === 'text') {
              doc.excerpt = response.data.excerpt
            } else {
              if (mkEngine == 'html2md') {
                doc.excerpt = html2md(
                  response.data.excerpt,
                  html2mdOptions,
                  true
                )
              } else {
                doc.excerpt = turndownService.turndown(response.data.excerpt)
              }
            }
          }
          if (response.data.meta.og.image) {
            doc.thumbnail = response.data.meta.og.image
          }

          if (outputFormat === 'text') {
            doc.content = response.data.textContent
          } else {
            if (mkEngine == 'html2md') {
              doc.content = html2md(response.data.content, html2mdOptions, true)
            } else {
              doc.content = turndownService.turndown(response.data.content)
            }
          }
          return executePostRequest(response.data.title, doc, null, null, null)
          //return doc
        }
        return { error: 'No content found' }
      })
      .catch(function (error) {
        console.log(error)
        set.status = 500
        return { error: 'Internal Server Error' }
      })
  },
}
