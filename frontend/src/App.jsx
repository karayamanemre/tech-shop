import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { setCredentials, logout } from './slices/authSlice';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Footer from './components/Footer';
export default function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/session', { credentials: 'include' })
      .then(async (r) => {
        if (!active) return;
        if (r.ok) {
          const { user } = await r.json();
          dispatch(user ? setCredentials(user) : logout());
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [dispatch]);
  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() =>
        document.querySelector(location.hash)?.scrollIntoView()
      );
    } else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return (
    <>
      <Header />
      <main className="shop-main">
        <Container>
          {ready ? (
            <Outlet />
          ) : (
            <div className="empty-state">Getting the store ready…</div>
          )}
        </Container>
      </main>
      <Footer />
      <ToastContainer position="bottom-right" autoClose={2500} />
    </>
  );
}
