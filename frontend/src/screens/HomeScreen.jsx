import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import Product from '../components/Product';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { FaAngleLeft } from 'react-icons/fa';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Paginate from '../components/Paginate';
import ProductCarousel from '../components/ProductCarousel';
import Meta from '../components/Meta';

const HomeScreen = () => {
  const { pageNumber, keyword } = useParams();
  const { data, isLoading, error } = useGetProductsQuery({
    keyword,
    pageNumber,
  });

  return (
    <>
      {!keyword ? (
        <>
          <h1>Top Rated Products</h1>
          <ProductCarousel />
        </>
      ) : (
        <Link
          className='btn my-3'
          to='/'
          style={{
            backgroundColor: '#657A8C',
            color: '#fff',
          }}
        >
          <FaAngleLeft
            style={{
              marginBottom: '3px',
            }}
          />
          Go Back
        </Link>
      )}
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          <Meta title={'Welcome to TechShop'} />
          <h1>Latest Products</h1>
          <Row>
            {[...data.products]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((product) => (
                <Col key={product._id} sm={12} md={6} lg={4} xl={3}>
                  <Product product={product}></Product>
                </Col>
              ))}
          </Row>
          <Paginate
            pages={data.pages}
            page={data.page}
            keyword={keyword ? keyword : ''}
          />
        </>
      )}
    </>
  );
};

export default HomeScreen;
