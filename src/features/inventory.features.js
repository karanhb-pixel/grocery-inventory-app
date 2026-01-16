import { state } from '../core/state.js';
import { saveInventory } from '../core/storage.js';

export function addItem(data) {
  state.inventory.push({
    id: state.nextItemId++,
    status: 'Active',
    ...data
  });
  saveInventory();
}

export function updateItem(id, updated) {
  const index = state.inventory.findIndex(i => i.id === id);
  state.inventory[index] = { ...state.inventory[index], ...updated };
  saveInventory();
}

export function deleteItem(id) {
  state.inventory = state.inventory.filter(i => i.id !== id);
  saveInventory();
}

export function getFilteredInventory() {
  let data = [...state.inventory];

  if (state.searchTerm) {
    const s = state.searchTerm.toLowerCase();
    data = data.filter(i =>
      i.name.toLowerCase().includes(s) ||
      i.category.toLowerCase().includes(s)
    );
  }

  data.sort((a, b) =>
    state.sortBy === 'name'
      ? a.name.localeCompare(b.name)
      : a.category.localeCompare(b.category)
  );

  return data;
}
