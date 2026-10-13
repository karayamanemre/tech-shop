import React,{useState,useEffect} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {FiSearch} from 'react-icons/fi';
export default function SearchBox(){const navigate=useNavigate();const {keyword}=useParams();const [text,setText]=useState(keyword||'');useEffect(()=>setText(keyword||''),[keyword]);return <form className="site-search" onSubmit={e=>{e.preventDefault();navigate(text.trim()?`/search/${encodeURIComponent(text.trim())}`:'/');}}><input aria-label="Search products" placeholder="What are you looking for?" value={text} maxLength={80} onChange={e=>setText(e.target.value)}/><button type="submit" aria-label="Search"><FiSearch/></button></form>;}
