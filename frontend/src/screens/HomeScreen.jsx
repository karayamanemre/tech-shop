import React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  FiArrowUpRight,
  FiGrid,
  FiHeadphones,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiWatch,
  FiBox,
} from 'react-icons/fi';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import Product from '../components/Product';
import Meta from '../components/Meta';
const icons = {
  Laptops: FiMonitor,
  Phones: FiSmartphone,
  Tablets: FiTablet,
  Audio: FiHeadphones,
  Wearables: FiWatch,
  Accessories: FiBox,
};
export default function HomeScreen() {
  const { keyword } = useParams();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'featured';
  const pageNumber = Number(params.get('page') || 1);
  const { data, isLoading, isFetching, error, refetch } = useGetProductsQuery({
    keyword,
    pageNumber,
    category,
    sort,
  });
  function filter(k, v) {
    const p = new URLSearchParams(params);
    v ? p.set(k, v) : p.delete(k);
    p.delete('page');
    setParams(p);
  }
  return (
    <>
      <Meta title="TechShop — Electronics" />
      {!keyword && !category && (
        <section className="hero">
          <div className="hero-copy">
            <h1>
              Explore <span>technology.</span>
            </h1>
            <a href="#catalog" className="hero-cta">
              Shop now <FiArrowUpRight />
            </a>
          </div>
          <div className="hero-art">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <img
              src="/catalog/101-1.webp"
              alt="AirPods Max headphones in silver"
              width="600"
              height="600"
              fetchPriority="high"
            />
            <div className="floating-product">
              <div>
                <strong>AirPods Max</strong>
              </div>
              <Link to="/search/AirPods%20Max" aria-label="Explore AirPods Max">
                <FiArrowUpRight />
              </Link>
            </div>
          </div>
        </section>
      )}
      <section id="catalog" className="catalog">
        <div className="section-heading">
          <div>
            <h2>
              {keyword ? `Results for “${keyword}”` : category || 'Products'}
            </h2>
          </div>
          <p>
            {data
              ? `${data.total} products · Demo prices in USD`
              : 'Loading the collection'}
          </p>
        </div>
        <div className="catalog-controls">
          <div className="category-filters">
            <button
              className={!category ? 'selected' : ''}
              onClick={() => filter('category', '')}
            >
              <FiGrid />
              All
            </button>
            {(data?.categories || Object.keys(icons)).map((c) => {
              const Icon = icons[c] || FiBox;
              return (
                <button
                  key={c}
                  className={category === c ? 'selected' : ''}
                  onClick={() => filter('category', c)}
                >
                  <Icon />
                  {c}
                </button>
              );
            })}
          </div>
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => filter('sort', e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>
        {error ? (
          <div className="empty-state">
            <h3>We could not load the collection.</h3>
            <p>Please try again.</p>
            <button onClick={refetch} className="btn btn-primary">
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <div className="product-skeleton" key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className={`product-grid ${isFetching ? 'is-fetching' : ''}`}>
              {data.products.map((p) => (
                <Product key={p._id} product={p} />
              ))}
            </div>
            {!data.products.length && (
              <div className="empty-state">
                <FiSearchFallback />
                <h3>No products found.</h3>
                <p>Try another search term or category.</p>
                <Link to="/" className="btn btn-primary">
                  View all products
                </Link>
              </div>
            )}
            {data.pages > 1 && (
              <nav className="pagination-row" aria-label="Product pages">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => {
                    const p = new URLSearchParams(params);
                    p.set('page', pageNumber - 1);
                    setParams(p);
                    document.getElementById('catalog').scrollIntoView();
                  }}
                >
                  ← Previous
                </button>
                {Array.from({ length: data.pages }, (_, i) => (
                  <button
                    key={i}
                    className={pageNumber === i + 1 ? 'active' : ''}
                    aria-current={pageNumber === i + 1 ? 'page' : undefined}
                    onClick={() => {
                      const p = new URLSearchParams(params);
                      p.set('page', i + 1);
                      setParams(p);
                      document.getElementById('catalog').scrollIntoView();
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={pageNumber >= data.pages}
                  onClick={() => {
                    const p = new URLSearchParams(params);
                    p.set('page', pageNumber + 1);
                    setParams(p);
                    document.getElementById('catalog').scrollIntoView();
                  }}
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}
function FiSearchFallback() {
  return <FiGrid size={32} />;
}
