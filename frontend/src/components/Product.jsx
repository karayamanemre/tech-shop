import React from 'react';
import {Link} from 'react-router-dom';
import {useDispatch} from 'react-redux';
import {FiPlus,FiArrowUpRight} from 'react-icons/fi';
import {toast} from 'react-toastify';
import {addToCart} from '../slices/cartSlice';
import {money} from '../utils/format';
export default function Product({product}){const dispatch=useDispatch();return <article className="product-card"><div className="product-visual"><span className="product-category">{product.category}</span><Link to={`/product/${product._id}`} tabIndex={-1} aria-hidden="true"><img loading="lazy" src={product.image} alt="" width="320" height="260"/></Link><Link className="view-product" to={`/product/${product._id}`} aria-label={`${product.name} detayları`}><FiArrowUpRight/></Link></div><div className="product-info"><small>{product.brand}</small><h3><Link to={`/product/${product._id}`}>{product.name}</Link></h3><div className="product-bottom"><div><strong>{money(product.price)}</strong><span>{product.countInStock>0?'Demo stokta':'Stokta yok'}</span></div><button className="add-product" disabled={!product.countInStock} aria-label={`${product.name} sepete ekle`} onClick={()=>{dispatch(addToCart({...product,qty:1}));toast.success('Sepete eklendi');}}><FiPlus/></button></div></div></article>;}
