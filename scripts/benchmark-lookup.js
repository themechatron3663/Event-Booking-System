// Run with: npm run benchmark
// Looks up 500 bookings among 100,000: Array.find vs Map.get.

import {
  createStore,
  createEvent,
  addTier,
  bookTickets,
} from '../src/domain/inventory.js';

const BOOKINGS = 200_000;
const LOOKUPS = 500;

const store = createStore();
const event = createEvent(store, { name: 'Benchmark' });
const tier = addTier(store, event.id, { name: 'General', priceCents: 0, capacity: BOOKINGS });

const bookings = [];
for (let i = 0; i < BOOKINGS; i++) {
  bookings.push(
    bookTickets(store, {
      eventId: event.id,
      tierId: tier.id,
      quantity: 1,
      attendeeName: `Guest ${i}`,
    })
  );
}

// 500 references spread evenly across the whole list.
const references = [];
for (let i = 0; i < LOOKUPS; i++) {
  references.push(bookings[Math.floor((i * BOOKINGS) / LOOKUPS)].reference);
}

function time(label, find) {
  const start = performance.now();
  for (const reference of references) find(reference);
  const ms = performance.now() - start;
  console.log(`${label.padEnd(18)} ${ms.toFixed(3)} ms for ${LOOKUPS} lookups`);
  return ms;
}

const arrayMs = time('Array.find  O(n)', (ref) => bookings.find((b) => b.reference === ref));
const mapMs = time('Map.get      O(1)', (ref) => store.bookingsByReference.get(ref));

console.log(`\nWith ${BOOKINGS} bookings, Map was about ${Math.round(arrayMs / Math.max(mapMs, 0.001))}x faster.`);