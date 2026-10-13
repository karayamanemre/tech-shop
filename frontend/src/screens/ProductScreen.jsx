import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiShoppingBag, FiCheck, FiBox } from 'react-icons/fi';
import {
  useGetProductDetailsQuery,
  useCreateReviewMutation,
} from '../slices/productsApiSlice';
import { addToCart } from '../slices/cartSlice';
import { money, date } from '../utils/format';
import Meta from '../components/Meta';
import Loader from '../components/Loader';
import Rating from '../components/Rating';
export default function ProductScreen() {
  const { id } = useParams();
  const { data: p, isLoading, error, refetch } = useGetProductDetailsQuery(id);
  const [image, setImage] = useState('');
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [review, { isLoading: busy }] = useCreateReviewMutation();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((s) => s.auth);
  useEffect(() => {
    setImage(p?.image || '');
    setQty(1);
  }, [p?.image, id]);
  if (isLoading) return <Loader />;
  if (error)
    return (
      <div className="empty-state">
        <h1>Product not found.</h1>
        <Link to="/">Back to the collection</Link>
      </div>
    );
  async function submit(e) {
    e.preventDefault();
    try {
      await review({ productId: id, rating: Number(rating), comment }).unwrap();
      setComment('');
      refetch();
      toast.success('Your review was added.');
    } catch (e) {
      toast.error(e?.data?.message || 'Could not add your review.');
    }
  }
  return (
    <>
      <Meta title={`${p.name} — TechShop`} description={p.description} />
      <Link className="back-link" to="/">
        <FiArrowLeft /> Back to the collection
      </Link>
      <div className="product-detail">
        <div>
          <div className="detail-gallery">
            <span className="product-category">{p.category}</span>
            <img src={image || p.image} alt={p.name} width="620" height="560" />
          </div>
          {p.images?.length > 1 && (
            <div className="gallery-thumbs">
              {p.images.map((src, i) => (
                <button
                  key={src}
                  className={image === src ? 'selected' : ''}
                  onClick={() => setImage(src)}
                  aria-label={`${p.name} image ${i + 1}`}
                  aria-pressed={image === src}
                >
                  <img src={src} alt="" width="80" height="80" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            {p.brand} · {p.category}
          </span>
          <h1>{p.name}</h1>
          {p.numReviews > 0 && (
            <Rating value={p.rating} text={`${p.numReviews} yorum`} />
          )}
          <div className="detail-price">
            {money(p.price)}
            <small>USD · illustrative demo price</small>
          </div>
          <p>{p.description}</p>
          <div className="stock-indicator">
            <FiCheck />
            {p.countInStock > 0
              ? `${p.countInStock} units in demo stock`
              : 'Out of stock'}
          </div>
          <div className="purchase-controls">
            <select
              aria-label="Quantity"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              disabled={!p.countInStock}
            >
              {Array.from({ length: Math.min(20, p.countInStock) }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1} units
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              disabled={!p.countInStock}
              onClick={() => {
                dispatch(addToCart({ ...p, qty }));
                toast.success('Added to cart.');
              }}
            >
              <FiShoppingBag /> Sepete ekle
            </button>
          </div>
          <div className="detail-note">
            <FiBox />
            <span>
              This is a portfolio demo. No card details are required;
              <br />
              no real payments or deliveries are made.
            </span>
          </div>
          <div className="detail-specs">
            <span>
              Brand<b>{p.brand}</b>
            </span>
            <span>
              Category<b>{p.category}</b>
            </span>
            <span>
              Product ID<b>{id.slice(0, 8).toUpperCase()}</b>
            </span>
          </div>
        </div>
      </div>
      <section className="reviews-section">
        <div>
          <span className="eyebrow">EXPERIENCES</span>
          <h2>Product reviews</h2>
          {!p.reviews.length && (
            <p>No reviews yet. Complete a demo order to leave the first one.</p>
          )}
          {p.reviews.map((r) => (
            <article className="review-card" key={r._id}>
              <strong>{r.name}</strong>
              <small>{date(r.createdAt)}</small>
              <Rating value={r.rating} />
              <p>{r.comment}</p>
            </article>
          ))}
        </div>
        <div className="review-form">
          <h3>Share your experience</h3>
          <p>You can review products from completed demo orders.</p>
          {userInfo ? (
            <form onSubmit={submit}>
              <label htmlFor="review-rating">Your rating</label>
              <select
                id="review-rating"
                className="form-select"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                  </option>
                ))}
              </select>
              <label htmlFor="review-comment">Your review</label>
              <textarea
                id="review-comment"
                className="form-control"
                rows={4}
                minLength={3}
                maxLength={1000}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button className="btn btn-primary" disabled={busy}>
                Submit review
              </button>
            </form>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Sign in to review
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
