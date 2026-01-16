import { state } from '../core/state.js';
import { saveBills } from '../core/storage.js';

export function addBill(bill) {
  state.bills.push({
    id: state.nextBillId++,
    ...bill
  });
  saveBills();
}

export function deleteBill(id) {
  state.bills = state.bills.filter(b => b.id !== id);
  saveBills();
}
