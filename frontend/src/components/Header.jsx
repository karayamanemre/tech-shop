import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { FiShoppingBag, FiUser, FiArrowUpRight } from 'react-icons/fi';
import { useLogoutMutation } from '../slices/usersApiSlice';
import { logout } from '../slices/authSlice';
import { apiSlice } from '../slices/apiSlice';
import SearchBox from './SearchBox';
export default function Header() {
  const { cartItems } = useSelector((s) => s.cart);
  const { userInfo } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logOut] = useLogoutMutation();
  async function exit() {
    try {
      await logOut().unwrap();
      dispatch(logout());
      dispatch(apiSlice.util.resetApiState());
      navigate('/');
    } catch {
      alert('Could not sign out. Please try again.');
    }
  }
  return (
    <>
      <div className="announcement">
        <span>Technology store · Portfolio demo</span>
        <a
          href="https://github.com/karayamanemre/tech-shop"
          target="_blank"
          rel="noreferrer"
        >
          Explore the project <FiArrowUpRight />
        </a>
      </div>
      <header className="shop-header">
        <Navbar expand="lg" collapseOnSelect>
          <Container>
            <Navbar.Brand as={Link} to="/" className="wordmark">
              <span className="brand-icon">t.</span>techshop
              <span className="brand-dot">®</span>
            </Navbar.Brand>
            <Navbar.Toggle
              aria-controls="shop-navigation"
              aria-label="Toggle navigation"
            />
            <Navbar.Collapse id="shop-navigation">
              <Nav className="main-nav">
                <Nav.Link as={Link} to="/">
                  Discover
                </Nav.Link>
                <Nav.Link as={Link} to="/?category=Laptops#catalog">
                  Laptops
                </Nav.Link>
                <Nav.Link as={Link} to="/?category=Audio#catalog">
                  Audio & accessories
                </Nav.Link>
              </Nav>
              <SearchBox />
              <Nav className="account-nav">
                {userInfo ? (
                  <NavDropdown
                    title={
                      <>
                        <FiUser /> {userInfo.name.split(' ')[0]}
                      </>
                    }
                    id="user-menu"
                  >
                    <NavDropdown.Item as={Link} to="/profile">
                      Account & orders
                    </NavDropdown.Item>
                    <NavDropdown.Item onClick={exit}>Sign out</NavDropdown.Item>
                    <NavDropdown.Item disabled>
                      {userInfo.email}
                    </NavDropdown.Item>
                  </NavDropdown>
                ) : (
                  <Nav.Link as={Link} to="/login" aria-label="Sign in">
                    <FiUser />
                    <span>Sign in</span>
                  </Nav.Link>
                )}
                {userInfo?.isAdmin && (
                  <NavDropdown title="Admin" id="admin-menu">
                    <NavDropdown.Item as={Link} to="/admin/productlist">
                      Products
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/orderlist">
                      Orders
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/userlist">
                      Users
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                <Nav.Link as={Link} to="/cart" className="cart-link">
                  <FiShoppingBag /> <span>Cart</span>
                  <b>{cartItems.reduce((n, p) => n + p.qty, 0)}</b>
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>
    </>
  );
}
