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
          title: 'Unleash Proxy API Documentation',
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
// http://127.0.0.1:3010/api/article?url=https%3A%2F%2Fwww.voiceflow.com%2Fabout&cache=no

app.get(
  '/parse',
  ({ scrapper, query, set }) =>
    scrapper.parse(query.url, query.cache, query.format, set),
  {
    detail: {
      tags: ['App'],
      summary: 'Add a workspace ID to Unleash segment',
      description:
        'Fetch data from Unleash to retreive existing workspace IDs and add a new one',
      parameters: [
        {
          name: 'url',
          in: 'query',
          description: 'Strategie name',
          required: true,
        },
        {
          name: 'cache',
          in: 'query',
          description: 'Use hashed version of workspace ID',
          required: false,
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

app.get(
  '/add/:id',
  ({ unleash, params, query, set }) =>
    unleash.add(params.id, query.name, query.workspace, query.hashed, set),
  {
    detail: {
      tags: ['App'],
      summary: 'Add a workspace ID to Unleash segment',
      description:
        'Fetch data from Unleash to retreive existing workspace IDs and add a new one',
      parameters: [
        { name: 'id', in: 'path', description: 'Segtment ID', required: true },
        {
          name: 'name',
          in: 'query',
          description: 'Strategie name',
          required: true,
        },
        {
          name: 'workspace',
          in: 'query',
          description: 'Workspace ID to add',
          required: true,
        },
        {
          name: 'hashed',
          in: 'query',
          description: 'Use hashed version of workspace ID',
          required: false,
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

app.listen(
  {
    port: Bun.env.PORT ?? 3000,
  },
  ({ hostname, port }) => {
    console.log(`Unleash Proxy API is running at ${hostname}:${port}`)
  }
)
