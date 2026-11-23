import { DomainError, ErrorCodes } from "./errors.js";
import { newId, newReference } from "./ids.js";
import { Queue } from "./waitlistQueue.js";

const MIN_TICKETS = 1;
const MAX_TICKETS = 10;

// ---------- validation helpers ----------

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new DomainError(ErrorCodes.VALIDATION, `${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireInteger(value, field, min, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    const range =
      max === Number.MAX_SAFE_INTEGER ? `at least ${min}` : `between ${min} and ${max}`;
    throw new DomainError(ErrorCodes.VALIDATION, `${field} must be a whole number ${range}`);
  }
  return value;
}

function getEvent(store, eventId) {
  const event = store.events.get(eventId);
  if (!event) throw new DomainError(ErrorCodes.NOT_FOUND, `Event not found: ${eventId}`);
  return event;
}

function getTier(event, tierId) {
  const tier = event.tiers.get(tierId);
  if (!tier) throw new DomainError(ErrorCodes.NOT_FOUND, `Tier not found: ${tierId}`);
  return tier;
}

// ---------- store ----------

export function createStore() {
  return {
    events: new Map(), // eventId -> event
    bookingsByReference: new Map(), // reference -> booking (O(1) lookup)
    waitlists: new Map(), // eventId -> Queue
  };
}

// ---------- events and tiers ----------

export function createEvent(store, { name }) {
  const event = { id: newId(), name: requireText(name, "name"), tiers: new Map() };
  store.events.set(event.id, event);
  return event;
}

// Money is whole cents. 500000 means 5,000.00, never 5000.0.
export function addTier(store, eventId, { name, priceCents, capacity }) {
  const event = getEvent(store, eventId);
  const tier = {
    id: newId(),
    name: requireText(name, "name"),
    priceCents: requireInteger(priceCents, "priceCents", 0),
    capacity: requireInteger(capacity, "capacity", 1),
    sold: 0,
  };
  event.tiers.set(tier.id, tier);
  return tier;
}

export function seatsLeft(store, eventId, tierId) {
  const tier = getTier(getEvent(store, eventId), tierId);
  return tier.capacity - tier.sold;
}

// ---------- bookings ----------

export function bookTickets(store, { eventId, tierId, quantity, attendeeName }) {
  // 1. Validate everything first. Nothing is changed until all checks pass.
  const name = requireText(attendeeName, "attendeeName");
  requireInteger(quantity, "quantity", MIN_TICKETS, MAX_TICKETS);
  const event = getEvent(store, eventId);
  const tier = getTier(event, tierId);

  const left = tier.capacity - tier.sold;
  if (quantity > left) {
    throw new DomainError(
      ErrorCodes.SOLD_OUT,
      `Only ${left} seat(s) left in "${tier.name}", but ${quantity} requested`
    );
  }

  let reference = newReference();
  while (store.bookingsByReference.has(reference)) reference = newReference();

  // 2. Only now do we change state.
  const booking = {
    id: newId(),
    reference,
    eventId,
    tierId,
    attendeeName: name,
    quantity,
    totalCents: quantity * tier.priceCents,
    status: "CONFIRMED",
  };
  tier.sold += quantity;
  store.bookingsByReference.set(reference, booking);
  return booking;
}

export function findBookingByReference(store, reference) {
  const key = requireText(reference, "reference").toUpperCase();
  const booking = store.bookingsByReference.get(key);
  if (!booking) {
    throw new DomainError(ErrorCodes.NOT_FOUND, `No booking with reference ${key}`);
  }
  return booking;
}

export function cancelBooking(store, reference) {
  const booking = findBookingByReference(store, reference);
  if (booking.status === "CANCELLED") {
    throw new DomainError(ErrorCodes.ALREADY_CANCELLED, `Booking ${booking.reference} is already cancelled`);
  }
  const tier = getTier(getEvent(store, booking.eventId), booking.tierId);
  tier.sold -= booking.quantity; // release the seats exactly once
  booking.status = "CANCELLED";
  return booking;
}

// ---------- waitlist ----------

export function joinWaitlist(store, { eventId, tierId, quantity, attendeeName }) {
  const name = requireText(attendeeName, "attendeeName");
  requireInteger(quantity, "quantity", MIN_TICKETS, MAX_TICKETS);
  const event = getEvent(store, eventId);
  getTier(event, tierId);

  let queue = store.waitlists.get(eventId);
  if (!queue) {
    queue = new Queue();
    store.waitlists.set(eventId, queue);
  }
  const entry = { id: newId(), attendeeName: name, tierId, quantity };
  queue.enqueue(entry);
  return { entry, position: queue.size };
}

// Who has waited longest, without removing them.
export function offerNextOnWaitlist(store, eventId) {
  getEvent(store, eventId);
  return store.waitlists.get(eventId)?.peek();
}