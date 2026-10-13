export const addDecimals = (num) => {
  return (Math.round(num * 100) / 100).toFixed(2);
};

export const updateCart = (state) => {
  // Calculate items price
  state.itemsPrice = addDecimals(
    state.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  );

  // Calculate shipping price (free shipping if items price > $500, else $10)
  state.shippingPrice = addDecimals(state.itemsPrice > 500 ? 0 : 10);

  // Calculate tax price (15% of items price)
  state.taxPrice = addDecimals(Number((0.15 * state.itemsPrice).toFixed(2)));

  // Calculate total price
  state.totalPrice = (
    Number(state.itemsPrice) +
    Number(state.shippingPrice) +
    Number(state.taxPrice)
  ).toFixed(2);

  localStorage.setItem('techshop-cart-v2', JSON.stringify(state));

  return state;
};

export function totals(items) {
  const cents = items.reduce(
    (s, x) => s + Math.round(x.price * 100) * x.qty,
    0
  );
  const shipping = items.length ? (cents > 50000 ? 0 : 1000) : 0;
  const tax = Math.round(cents * 0.15);
  return {
    itemsPrice: cents / 100,
    shippingPrice: shipping / 100,
    taxPrice: tax / 100,
    totalPrice: (cents + shipping + tax) / 100,
  };
}
