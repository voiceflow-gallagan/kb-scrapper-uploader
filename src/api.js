import axios from 'axios'
import html2md from 'html-to-md'

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
  ],
  emptyTags: [],
  aliasTags: {
    figure: 'p',
    dl: 'p',
    dd: 'p',
    dt: 'p',
    figcaption: 'p',
  },
  renderCustomTags: true,
}

export const Scrapper = {
  parse: async function (url, cache, format, set) {
    console.log(url)
    console.log(format)
    let outputFormat = format || 'text'
    let useCache = cache || 'no'

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
    console.log(outputFormat)
    //`http://127.0.0.1:3010/api/article?url=${url}&cache=${useCache}&full-content=${full}`,
    return axios
      .get(`http://127.0.0.1:3010/api/article?url=${url}&cache=${useCache}`, {
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

          return doc //response.data
        }
        return { error: 'No content found' }
      })
      .catch(function (error) {
        console.log(error)
        set.status = 500
        return { error: 'Internal Server Error' }
      })
  },
  addSegment: async function (id, workspace, hashed, set) {
    let wkID = workspace
    if (hashed == false) {
      wkID = await teamhash.decode(workspace)[0]
    }
    return axios
      .get(
        `https://app.unleash-hosted.com/voiceflow/api/admin/segments/${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: Bun.env.UNLEASH_API_KEY,
          },
        }
      )
      .then(function (response) {
        let tmp = response.data
        tmp.constraints[0].values.push(wkID)
        delete tmp.createdAt
        delete tmp.createdBy
        delete tmp.description
        delete tmp.id
        return axios
          .put(
            `https://app.unleash-hosted.com/voiceflow/api/admin/segments/${id}`,
            tmp,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: Bun.env.UNLEASH_API_KEY,
              },
            }
          )
          .then(function (response) {
            return response.data
          })
          .catch(function (error) {
            console.log(error)
            set.status = 500
            return { error: 'Internal Server Error' }
          })
      })
      .catch(function (error) {
        console.log(error)
        set.status = 500
        return { error: 'Internal Server Error' }
      })
  },
}
