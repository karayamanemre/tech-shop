import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useCreateOrderMutation } from '../slices/ordersApiSlice';
import { clearCartItems } from '../slices/cartSlice';
import CheckoutSteps from '../components/CheckoutSteps';
import { money } from '../utils/format';
import { totals } from '../utils/cartUtils';
export default function PlaceOrderScreen() {
  const cart = useSelector((s) => s.cart);
  const amounts = totals(cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const key = useRef(crypto.randomUUID());
  const [create, { isLoading, error }] = useCreateOrderMutation();
  useEffect(() => {
    if (!cart.shippingAddress?.address) navigate('/shipping');
  }, [cart.shippingAddress, navigate]);
  async function submit() {
    try {
      const order = await create({
        requestKey: key.current,
        orderItems: cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod: 'Demo',
      }).unwrap();
      dispatch(clearCartItems());
      navigate(`/order/${order._id}`);
    } catch (e) {
      toast.error(e?.data?.message || 'Could not create your order.');
    }
  }
  return (
    <>
      <CheckoutSteps step1 step2 step3 step4 />
      <h1 className="page-title">One last look.</h1>
      <div className="checkout-layout">
        <div>
          <div className="panel">
            <h2>Your selected products</h2>
            {cart.cartItems.map((p) => (
              <div className="order-item" key={p._id}>
                <img src={p.image} alt={p.name} />
                <div>
                  <Link to={`/product/${p._id}`}>{p.name}</Link>
                  <small>
                    {p.qty} units × {money(p.price)}
                  </small>
                </div>
                <strong>{money(p.qty * p.price)}</strong>
              </div>
            ))}
          </div>
          <div className="panel">
            <h2>Demo shipping address</h2>
            <p>
              {cart.shippingAddress.address}
              <br />
              {cart.shippingAddress.city}, {cart.shippingAddress.postalCode} ·{' '}
              {cart.shippingAddress.country}
            </p>
            <Link to="/shipping" className="back-link">
              Edit address →
            </Link>
          </div>
        </div>
        <aside className="panel order-summary">
          <h2>Order summary</h2>
          {[
            ['Products', amounts.itemsPrice],
            ['Demo shipping', amounts.shippingPrice],
            ['Demo tax (15%)', amounts.taxPrice],
          ].map(([l, n]) => (
            <div className="summary-line" key={l}>
              <span>{l}</span>
              <b>{money(n)}</b>
            </div>
          ))}
          <div className="summary-line total">
            <span>Total</span>
            <b>{money(amounts.totalPrice)}</b>
          </div>
          <div className="demo-notice">
            <strong>This is a demo order.</strong>
            <p>
              No real payment is collected. Your order is saved to the database.
            </p>
          </div>
          {error && (
            <p role="alert">
              {error?.data?.message || 'Could not create your order.'}
            </p>
          )}
          <button
            className="btn btn-primary w-100"
            disabled={isLoading || !cart.cartItems.length}
            onClick={submit}
          >
            {isLoading ? 'Saving your order…' : 'Place demo order →'}
          </button>
        </aside>
      </div>
    </>
  );
}
