import { state } from './state.js';
import { STORAGE_KEY, BILLS_STORAGE_KEY } from './constants.js';

export function loadStorage() {
  state.inventory = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  state.bills = JSON.parse(localStorage.getItem(BILLS_STORAGE_KEY)) || [];

  state.nextItemId =
    state.inventory.length > 0
      ? Math.max(...state.inventory.map(i => i.id)) + 1
      : 1;

  state.nextBillId =
    state.bills.length > 0
      ? Math.max(...state.bills.map(b => b.id)) + 1
      : 1;
}

export function saveInventory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.inventory));
}

export function saveBills() {
  localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(state.bills));
}
