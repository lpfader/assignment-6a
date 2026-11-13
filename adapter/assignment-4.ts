import previous_assignment from './assignment-3'
import { errorFromResponse } from './errors'

export type BookID = string

export interface Book {
  id?: BookID
  name: string
  author: string
  description: string
  price: number
  image: string
}

export interface Filter {
  from?: number
  to?: number
  name?: string
  author?: string
}

// If multiple filters are provided, any book that matches at least one of them should be returned
// Within a single filter, a book would need to match all the given conditions
async function listBooks (filters?: Filter[]): Promise<Book[]> {
  // The reverse proxy caches the unfiltered list, so it needs to know when
  // filters are actually being applied
  const hasFilters = (filters ?? []).some(
    ({ from, to, name, author }) =>
      typeof from === 'number' ||
      typeof to === 'number' ||
      (typeof name === 'string' && name.trim().length > 0) ||
      (typeof author === 'string' && author.trim().length > 0)
  )

  // We then make the request
  const result = await fetch('/api/books/list', {
    body: JSON.stringify(filters ?? []),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(hasFilters ? { 'X-Book-Filters': '1' } : {})
    }
  })

  if (result.ok) {
    // And if it is valid, we parse the JSON result and return it.
    return (await result.json()) as Book[]
  } else {
    throw await errorFromResponse('Failed to fetch books', result)
  }
}

async function createOrUpdateBook (book: Book): Promise<BookID> {
  return await previous_assignment.createOrUpdateBook(book)
}

async function removeBook (book: BookID): Promise<void> {
  await previous_assignment.removeBook(book)
}

async function lookupBookById (book: BookID): Promise<Book> {
  const result = await fetch(`/api/books/${book}`)
  if (result.ok) {
    return (await result.json()) as Book
  } else {
    throw await errorFromResponse('Could not find book', result)
  }
}

export type ShelfId = string
export type OrderId = string

async function placeBooksOnShelf (bookId: BookID, numberOfBooks: number, shelf: ShelfId): Promise<void> {
  const result = await fetch(`/api/warehouse/${bookId}/${shelf}/${numberOfBooks}`, { method: 'put' })
  if (!result.ok) {
    throw await errorFromResponse('Could not place books on shelf', result)
  }
}

async function orderBooks (order: BookID[]): Promise<{ orderId: OrderId }> {
  const result = await fetch('/api/order', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order })
  })
  if (!result.ok) {
    throw await errorFromResponse('Could not place order', result)
  }
  return { orderId: await result.text() }
}

async function findBookOnShelf (book: BookID): Promise<Array<{ shelf: ShelfId, count: number }>> {
  const result = await fetch(`/api/warehouse/${book}`)
  if (result.ok) {
    const results = (await result.json()) as Record<ShelfId, number>
    const shelfArray: Array<{ shelf: ShelfId, count: number }> = []
    for (const shelf of Object.keys(results)) {
      shelfArray.push({
        shelf,
        count: results[shelf]
      })
    }
    return shelfArray
  } else {
    throw await errorFromResponse('Could not find book on shelf', result)
  }
}

async function fulfilOrder (
  order: OrderId,
  booksFulfilled: Array<{ book: BookID, shelf: ShelfId, numberOfBooks: number }>
): Promise<void> {
  const result = await fetch(`/api/fulfil/${order}`, {
    method: 'put',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booksFulfilled })
  })
  if (!result.ok) {
    throw await errorFromResponse('Could not fulfil order', result)
  }
}

async function listOrders (): Promise<Array<{ orderId: OrderId, books: Record<BookID, number> }>> {
  const result = await fetch('/api/order')
  if (result.ok) {
    return (await result.json()) as Array<{ orderId: OrderId, books: Record<BookID, number> }>
  } else {
    throw await errorFromResponse('Could not list orders', result)
  }
}

const assignment = 'assignment-4'

export default {
  assignment,
  createOrUpdateBook,
  removeBook,
  listBooks,
  placeBooksOnShelf,
  orderBooks,
  findBookOnShelf,
  fulfilOrder,
  listOrders,
  lookupBookById
}
