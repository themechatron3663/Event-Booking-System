// Run with: npm run demo
// A guided tour of the Build 1 domain logic in the terminal.

import {
  createStore,
  createEvent,
  addTier,
  bookTickets,
  cancelBooking,
  joinWaitlist,
  offerNextOnWaitlist,
  findBookingByReference,
  seatsLeft,
} from '../src/domain/inventory.js';
import { DomainError } from '../src/domain/errors.js';

const store = createStore();

const event = createEvent(store, { name: 'Lagos Tech Meetup' });
const tier = addTier(store, event.id, { name: 'General', priceCents: 500_000, capacity: 3 });
console.log(`Created "${event.name}" with ${tier.capacity} seats in ${tier.name}.\n`);

const left = () => seatsLeft(store, event.id, tier.id);

function attempt(label, action) {
  try {
    const result = action();
    console.log(`OK    ${label}`);
    return result;
  } catch (error) {
    if (!(error instanceof DomainError)) throw error;
    console.log(`FAIL  ${label} -> ${error.code}: ${error.message}`);
    return undefined;
  }
}

const book = (attendeeName, quantity) => () =>
  bookTickets(store, { eventId: event.id, tierId: tier.id, quantity, attendeeName });

const wait = (attendeeName, quantity) => () =>
  joinWaitlist(store, { eventId: event.id, tierId: tier.id, quantity, attendeeName });

const ada = attempt('Ada books 2 tickets', book('Ada', 2));
attempt('Bayo books 2 tickets (only 1 left)', book('Bayo', 2));
attempt('Bayo books 1 ticket', book('Bayo', 1));
console.log(`\nSeats left: ${left()}\n`);

attempt('Chidi joins the waitlist for 2 seats', wait('Chidi', 2));
attempt('Dayo joins the waitlist for 1 seat', wait('Dayo', 1));

console.log(`\nLooking up Ada's booking by reference ${ada.reference}:`);
console.log(findBookingByReference(store, ada.reference));

console.log();
attempt('Ada cancels', () => cancelBooking(store, ada.reference));
console.log(`Seats left: ${left()}`);

const offer = offerNextOnWaitlist(store, event.id);
console.log('Next on the waitlist:', offer);