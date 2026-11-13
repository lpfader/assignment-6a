import server from './server'

// No top-level await here on purpose: it makes this file an async module, which Node 20 cannot require() when tsx runs it as CommonJS.
async function start (): Promise<void> {
  await server(3000)
}

void start()
