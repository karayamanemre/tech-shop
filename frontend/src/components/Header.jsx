import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { FiShoppingBag, FiUser, FiArrowUpRight } from 'react-icons/fi';
import { useLogoutMutation } from '../slices/usersApiSlice';
import { logout } from '../slices/authSlice';
import { apiSlice } from '../slices/apiSlice';
import SearchBox from './SearchBox';
export default function Header(){
 const {cartItems}=useSelector(s=>s.cart);const {userInfo}=useSelector(s=>s.auth);const dispatch=useDispatch();const navigate=useNavigate();const [logOut]=useLogoutMutation();
 async function exit(){try{await logOut().unwrap();dispatch(logout());dispatch(apiSlice.util.resetApiState());navigate('/');}catch{alert('Çıkış yapılamadı. Lütfen tekrar dene.');}}
 return <><div className="announcement"><span>Teknoloji mağazası · Portfolyo demosu</span><a href="https://github.com/karayamanemre/tech-shop" target="_blank" rel="noreferrer">Projeyi incele <FiArrowUpRight/></a></div><header className="shop-header"><Navbar expand="lg" collapseOnSelect><Container><Navbar.Brand as={Link} to="/" className="wordmark"><span className="brand-icon">t.</span>techshop<span className="brand-dot">®</span></Navbar.Brand><Navbar.Toggle aria-controls="shop-navigation"/><Navbar.Collapse id="shop-navigation"><Nav className="main-nav"><Nav.Link as={Link} to="/">Keşfet</Nav.Link><Nav.Link as={Link} to="/?category=Bilgisayar#catalog">Bilgisayar</Nav.Link><Nav.Link as={Link} to="/?category=Ses#catalog">Ses & aksesuar</Nav.Link></Nav><SearchBox/><Nav className="account-nav">{userInfo?<NavDropdown title={<><FiUser/> {userInfo.name.split(' ')[0]}</>} id="user-menu"><NavDropdown.Item as={Link} to="/profile">Hesabım & siparişler</NavDropdown.Item><NavDropdown.Item onClick={exit}>Çıkış yap</NavDropdown.Item><NavDropdown.Item disabled>{userInfo.email}</NavDropdown.Item></NavDropdown>:<Nav.Link as={Link} to="/login" aria-label="Giriş yap"><FiUser/><span>Giriş yap</span></Nav.Link>}{userInfo?.isAdmin&&<NavDropdown title="Yönetim" id="admin-menu"><NavDropdown.Item as={Link} to="/admin/productlist">Ürünler</NavDropdown.Item><NavDropdown.Item as={Link} to="/admin/orderlist">Siparişler</NavDropdown.Item><NavDropdown.Item as={Link} to="/admin/userlist">Kullanıcılar</NavDropdown.Item></NavDropdown>}<Nav.Link as={Link} to="/cart" className="cart-link"><FiShoppingBag/> <span>Sepet</span><b>{cartItems.reduce((n,p)=>n+p.qty,0)}</b></Nav.Link></Nav></Navbar.Collapse></Container></Navbar></header></>;
}
