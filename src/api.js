import axios from 'axios'
import html2md from 'html-to-md'
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
          return doc
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
