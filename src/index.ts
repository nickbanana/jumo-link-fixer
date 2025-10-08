import { Hono } from 'hono'

type Bindings = {
  BROWSERBASE_API_KEY: string;
}

const app = new Hono<{Bindings: Bindings}>()

app.get('/', (c) => {
  // 獲取 Secret（已成功）
  const apiKey = c.env.BROWSERBASE_API_KEY;

  return c.text('NOW it can CI/CD !');
})

app.get('*', (c) => {
  const url = new URL(c.req.url);
  return c.text(`You requested the path: ${url.pathname}`);
})

export default app
