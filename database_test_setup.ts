import { MongoMemoryServer } from 'mongodb-memory-server'
import { afterAll } from 'vitest'

export async function setup (): Promise<void> {
  // Every test file starts its own mongod, and they start in parallel. The
  // 10 second default launch timeout is too tight on a slow or bind-mounted
  // disk, which shows up as "Instance failed to start within 10000ms".
  const instance = await MongoMemoryServer.create({
    binary: { version: '7.0.7' },
    instance: { launchTimeout: 60000 }
  })
  while (instance.state === 'new') {
    await instance.start()
  }
  const uri = instance.getUri()
  ;(global as any).__MONGOINSTANCE = instance
  ;(global as any).MONGO_URI = uri.slice(0, uri.lastIndexOf('/'))
}

export async function teardown (): Promise<void> {
  const instance: MongoMemoryServer = (global as any).__MONGOINSTANCE
  await instance.stop({ doCleanup: true })
}

await setup()

afterAll(teardown)
