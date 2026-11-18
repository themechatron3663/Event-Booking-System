// First in, first out, built as a linked list so every operation is
// O(1). Array.shift() would be O(n) because it moves every element.
export class Queue {
  #head = null;
  #tail = null;
  #size = 0;

  enqueue(value) {
    const node = { value, next: null };
    if (this.#tail === null) {
      this.#head = node;
      this.#tail = node;
    } else {
      this.#tail.next = node;
      this.#tail = node;
    }
    this.#size++;
  }

  dequeue() {
    if (this.#head === null) return undefined;
    const node = this.#head;
    this.#head = node.next;
    if (this.#head === null) this.#tail = null;
    this.#size--;
    return node.value;
  }

  peek() {
    return this.#head === null ? undefined : this.#head.value;
  }

  get size() {
    return this.#size;
  }
}