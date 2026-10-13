import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiPackage } from 'react-icons/fi';
import {
  useGetOrderDetailsQuery,
  usePayOrderMutation,
  useDeliverOrderMutation,
} from '../slices/ordersApiSlice';
import { money, date } from '../utils/format';
import Loader from '../components/Loader';
export default function OrderScreen() {
  const { id } = useParams();
  const { data: o, isLoading, error, refetch } = useGetOrderDetailsQuery(id);
  const [complete, { isLoading: busy }] = usePayOrderMutation();
  const [deliver, { isLoading: delivering }] = useDeliverOrderMutation();
  const { userInfo } = useSelector((s) => s.auth);
  if (isLoading) return <Loader />;
  if (error)
    return (
      <div className="empty-state">
        <h1>Could not load this order</h1>
        <p>{error?.data?.message}</p>
        <Link to="/profile">Back to my orders</Link>
      </div>
    );
  async function finish() {
    try {
      await complete({ orderId: id }).unwrap();
      await refetch();
      toast.success('Demo purchase completed. No payment was collected.');
    } catch (e) {
      toast.error(e?.data?.message || 'Could not complete the action.');
    }
  }
  async function shipped() {
    try {
      await deliver(id).unwrap();
      refetch();
      toast.success('Demo delivery marked.');
    } catch (e) {
      toast.error(e?.data?.message || 'Could not complete the action.');
    }
  }
  return (
    <>
      <Link to="/profile" className="back-link">
        ← My orders
      </Link>
      <div className="section-heading">
        <div>
          <span className="eyebrow">DEMO ORDER · {date(o.createdAt)}</span>
          <h1>#{id.slice(0, 8).toUpperCase()}</h1>
        </div>
        <span className={`status-pill ${o.demoCompleted ? 'complete' : ''}`}>
          {o.demoCompleted ? 'Demo completed' : 'Awaiting completion'}
        </span>
      </div>
      <div className="checkout-layout">
        <div>
          <div className="panel">
            <h2>Your order items</h2>
            {o.orderItems.map((p) => (
              <div className="order-item" key={p.product}>
                <img src={p.image} alt={p.name} />
                <div>
                  <Link to={`/product/${p.product}`}>{p.name}</Link>
                  <small>
                    {p.qty} units × {money(p.price)}
                  </small>
                </div>
                <strong>{money(p.price * p.qty)}</strong>
              </div>
            ))}
          </div>
          <div className="panel">
            <h2>Shipping details</h2>
            <p>
              {o.user?.name} · {o.user?.email}
            </p>
            <p>
              {o.shippingAddress.address}, {o.shippingAddress.city}
              <br />
              {o.shippingAddress.postalCode} · {o.shippingAddress.country}
            </p>
            <span className="status-pill">
              <FiPackage />{' '}
              {o.isDelivered ? 'Demo delivered' : 'Demo delivery pending'}
            </span>
          </div>
        </div>
        <aside className="panel order-summary">
          <h2>Order summary</h2>
          {[
            ['Products', o.itemsPrice],
            ['Demo shipping', o.shippingPrice],
            ['Demo tax (15%)', o.taxPrice],
          ].map(([l, n]) => (
            <div className="summary-line" key={l}>
              <span>{l}</span>
              <b>{money(n)}</b>
            </div>
          ))}
          <div className="summary-line total">
            <span>Total</span>
            <b>{money(o.totalPrice)}</b>
          </div>
          <div className="demo-notice">
            <strong>No real payments collected.</strong>
            <p>
              This total is illustrative. The order and delivery are simulated.
            </p>
          </div>
          {o.demoCompleted ? (
            <div className="completion">
              <FiCheckCircle />
              <strong>Demo purchase completed</strong>
              <Link to="/">Back to the collection →</Link>
            </div>
          ) : (
            <button
              className="btn btn-primary w-100"
              disabled={busy}
              onClick={finish}
            >
              {busy ? 'Completing…' : 'Complete demo purchase'}
            </button>
          )}
          {userInfo?.isAdmin && o.demoCompleted && !o.isDelivered && (
            <button
              className="btn btn-outline-primary w-100 mt-3"
              disabled={delivering}
              onClick={shipped}
            >
              Mark demo delivery
            </button>
          )}
        </aside>
      </div>
    </>
  );
}
