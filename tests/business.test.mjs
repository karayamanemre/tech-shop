import test from 'node:test';
import assert from 'node:assert/strict';
import {
  totals,
  canReadOrder,
  checkoutSchema,
  registration,
} from '../backend/validation.js';
test('money computed in cents including shipping boundary', () => {
  assert.deepEqual(totals([{ price: 19.99, qty: 3 }]), {
    itemsPrice: 59.97,
    shippingPrice: 10,
    taxPrice: 9,
    totalPrice: 78.97,
  });
  assert.equal(totals([{ price: 500, qty: 1 }]).shippingPrice, 10);
  assert.equal(totals([{ price: 500.01, qty: 1 }]).shippingPrice, 0);
});
test('order privacy requires owner or admin', () => {
  assert.equal(
    canReadOrder({ _id: 'a', isAdmin: false }, { userId: 'b' }),
    false
  );
  assert.equal(canReadOrder({ _id: 'a' }, { userId: 'a' }), true);
  assert.equal(canReadOrder({ isAdmin: true }, { userId: 'b' }), true);
  assert.equal(canReadOrder(null, { userId: 'a' }), false);
});
test('checkout ignores supplied totals and rejects duplicate, empty and negative quantity', () => {
  const item = { _id: '00000000-0000-4000-8000-000000000001', qty: 1 };
  const body = {
    orderItems: [item],
    shippingAddress: {
      address: 'Demo Street',
      city: 'Istanbul',
      postalCode: '34000',
      country: 'Turkey',
    },
    paymentMethod: 'Demo',
    totalPrice: 0.01,
    isPaid: true,
  };
  const parsed = checkoutSchema.parse(body);
  assert.equal(parsed.totalPrice, undefined);
  assert.equal(parsed.isPaid, undefined);
  assert.throws(() => checkoutSchema.parse({ ...body, orderItems: [] }));
  assert.throws(() =>
    checkoutSchema.parse({ ...body, orderItems: [item, item] })
  );
  assert.throws(() =>
    checkoutSchema.parse({ ...body, orderItems: [{ ...item, qty: -1 }] })
  );
  assert.throws(() =>
    checkoutSchema.parse({ ...body, paymentMethod: 'PayPal' })
  );
});
test('registration cannot elevate admin and enforces password bounds', () => {
  const p = registration.parse({
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'LongPassword123!',
    isAdmin: true,
  });
  assert.equal(p.isAdmin, undefined);
  assert.throws(() => registration.parse({ ...p, password: 'short' }));
  assert.throws(() => registration.parse({ ...p, password: 'x'.repeat(73) }));
});
