import { Elysia, t } from 'elysia'
import { serverTiming } from '@elysiajs/server-timing'
import { swagger } from '@elysiajs/swagger'
import { Scrapper } from './api'

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        tags: [
          { name: 'Health', description: 'Health endpoint' },
          { name: 'App', description: 'General endpoints' },
        ],
        info: {
          title: 'KB Scrapper API Documentation',
          description: 'Development documentation',
          version: '1.0.1',
        },
      },
    })
  )
  .use(
    serverTiming({
      enabled: true,
    })
  )
  .decorate('getDate', () => Date.now())
  .decorate('scrapper', Scrapper)

app.get(
  '/health',
  ({ set }) => {
    set.status = 200
    return { health: 'ok' }
  },
  {
    detail: {
      deprecated: false,
      tags: ['Health'],
      summary: 'Health endpoint, used in container for healthchecks',
      description: 'Check API health',
      responses: {
        200: { description: 'Success' },
        500: { description: 'Internal Server Error' },
      },
    },
  }
)

app.get(
  '/parse',
  ({ scrapper, query, set }) =>
    scrapper.parse(
      set,
      encodeURI(query.url),
      query.cache,
      query.format,
      query.kb || false
    ),
  {
    detail: {
      tags: ['App'],
      summary: 'Parse an URL and generate a JSON object',
      description:
        'Scrappe the given URL and return a JSON object with the content in the specified format',
      parameters: [
        {
          name: 'url',
          in: 'query',
          description: 'URL to parse',
          required: true,
          schema: {
            type: 'string',
          },
        },
        {
          name: 'cache',
          in: 'query',
          description: 'Use cache or not (default to true)',
          required: false,
          schema: {
            type: 'boolean',
            enum: [true, false],
          },
        },
        {
          name: 'format',
          in: 'query',
          description: 'Format for the output (default to text)',
          required: false,
          schema: {
            type: 'string',
            enum: ['text', 'markdown'],
          },
        },
        {
          name: 'kb',
          in: 'query',
          description: 'Push to KB (default to false)',
          required: false,
          schema: {
            type: 'boolean',
            enum: [true, false],
          },
        },
      ],
      responses: {
        200: { description: 'Success' },
        400: { description: 'Bad Request' },
        500: { description: 'Internal Server Error' },
      },
    },
  }
)

app.post(
  '/add',
  ({ scrapper, body, set }) =>
    scrapper.parse(
      set,
      body.url,
      body.cache,
      body.format,
      true,
      body.VFAPIKey,
      body.projectID
    )
  /* console.log(doc)
    const result = await Scrapper.upload(
      doc.title,
      doc.content, //response.data.textContent,
      'VF.DM.65652b1da1e7a600072c3680.zv2bGKnpqm5baVsV',
      '65652b1da1e7a600072c367f',
      set
    )

    return result */

  /* {
    detail: {
      tags: ['App'],
      summary: 'Parse an URL and generate a JSON object',
      description:
        'Scrappe the given URL and return a JSON object with the content in the specified format',
      parameters: [
        {
          name: 'url',
          in: 'query',
          description: 'URL to parse',
          required: true,
          schema: {
            type: 'string',
          },
        },
        {
          name: 'cache',
          in: 'query',
          description: 'Use cache or not (default to true)',
          required: false,
          schema: {
            type: 'boolean',
            enum: [true, false],
          },
        },
        {
          name: 'format',
          in: 'query',
          description: 'Format for the output (default to text)',
          required: false,
          schema: {
            type: 'string',
            enum: ['text', 'markdown'],
          },
        },
      ],
      responses: {
        200: { description: 'Success' },
        400: { description: 'Bad Request' },
        500: { description: 'Internal Server Error' },
      },
    },
  } */
)

app.listen(
  {
    port: Bun.env.PORT ?? 3000,
  },
  ({ hostname, port }) => {
    console.log(`KB Scrapper API is running at ${hostname}:${port}`)
  }
)
