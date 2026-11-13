import { expect, test } from 'vitest'
import setup, { type ServerTestContext } from './run_server'
import { generateId, seedBookDatabase } from '../database_test_utilities'
import { type BookID, type Book } from '../src/documented_types'
import { ObjectId } from 'mongodb'

setup()

// The DELETE /books/{id} route is registered on the zod router rather than on a
// tsoa controller, so it is not part of the generated client. These tests use
// fetch directly against the running server instead.

test<ServerTestContext>('deleting a book removes it, and deleting it again is a 404', async ({ address, state }) => {
  const id = generateId<BookID>()
  const book: Book = {
    id,
    name: 'Delete Me',
    author: 'An Author',
    description: '',
    price: 1,
    image: ''
  }
  await seedBookDatabase(state.books, { books: { [id]: book } })

  const first = await fetch(`${address}/books/${id}`, { method: 'DELETE' })

  expect(first.status).toEqual(200)
  expect(await state.books.books.findOne({ _id: ObjectId.createFromHexString(id) })).toBeNull()

  const second = await fetch(`${address}/books/${id}`, { method: 'DELETE' })

  expect(second.status).toEqual(404)
})

test<ServerTestContext>('placing copies on a shelf makes them show up in the book info', async ({ address }) => {
  const bookId = generateId<BookID>()

  const placed = await fetch(`${address}/warehouse/${bookId}/shelf_1/5`, { method: 'PUT' })

  expect(placed.status).toEqual(201)

  const info = await fetch(`${address}/warehouse/${bookId}`)

  expect(info.status).toEqual(200)
  expect(await info.json()).toEqual({ shelf_1: 5 })
})

test<ServerTestContext>('placing then fulfilling an order takes the copies off the shelf', async ({ address }) => {
  const bookId = generateId<BookID>()

  await fetch(`${address}/warehouse/${bookId}/shelf_1/5`, { method: 'PUT' })

  const placedOrder = await fetch(`${address}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: [bookId] })
  })

  expect(placedOrder.status).toEqual(201)

  const orderId = await placedOrder.text()

  expect(orderId.length).toBeGreaterThan(0)

  const fulfilled = await fetch(`${address}/fulfil/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booksFulfilled: [{ book: bookId, shelf: 'shelf_1', numberOfBooks: 1 }] })
  })

  expect(fulfilled.status).toEqual(201)

  const info = await fetch(`${address}/warehouse/${bookId}`)

  expect(await info.json()).toEqual({ shelf_1: 4 })

  const orderList = await fetch(`${address}/order`)
  const orders = (await orderList.json()) as Array<{ orderId: string }>

  expect(orders.some((order) => order.orderId === orderId)).toBe(false)
})

test<ServerTestContext>('fulfilling an order that does not exist is an error', async ({ address }) => {
  const missingOrder = generateId<BookID>()

  const result = await fetch(`${address}/fulfil/${missingOrder}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booksFulfilled: [] })
  })

  expect(result.status).toEqual(500)
})

test<ServerTestContext>('a book with unexpected extra fields is rejected', async ({ address }) => {
  const result = await fetch(`${address}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bad Book',
      author: 'An Author',
      description: '',
      price: 1,
      image: '',
      nonsense: true
    })
  })

  expect(result.status).toBeGreaterThanOrEqual(400)
})
