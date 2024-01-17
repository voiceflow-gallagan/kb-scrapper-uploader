import axios from 'axios'
import html2md from 'html-to-md'
import FormData from 'form-data'

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
  renderCustomTags: 'SKIP',
}

/* Function to upload to KB */
async function executePostRequest(filename, doc, apiKey, projectID, callback) {
  let form = new FormData()

  form.append('file', JSON.stringify(doc), { filename: filename })
  form.append('canEdit', 'true')

  let config = {
    method: 'post',
    url: `https://api.voiceflow.com/v3/projects/${projectID}/knowledge-base/documents/file`,
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': `multipart/form-data; boundary=${form.getBoundary()}`,
      authorization: apiKey,
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
  parse: async function (url, cache, format, set) {
    let outputFormat = format || 'text'
    let useCache = cache || 'yes'

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
      .get(`http://scrapper:3000/api/article?url=${url}&cache=${useCache}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
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
              doc.excerpt = html2md(response.data.excerpt, html2mdOptions, true)
            }
          }
          if (response.data.meta.og.image) {
            doc.thumbnail = response.data.meta.og.image
          }

          if (outputFormat === 'text') {
            doc.content = response.data.textContent
          } else {
            doc.content = html2md(response.data.content, html2mdOptions, true)
          }
          return executePostRequest(
            response.data.title,
            doc, //response.data.textContent,
            'VF.DM.65652b1da1e7a600072c3680.zv2bGKnpqm5baVsV',
            '65652b1da1e7a600072c367f',
            null
          )
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
