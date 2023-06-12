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
    <div>
      {!keyword ? (
        <>
          <h1 className='display-8'>Top Rated Products</h1>
          <ProductCarousel />
        </>
      ) : (
        <Link className='btn btn-dark my-3' to='/'>
          <FaAngleLeft />
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
          <h1 className='display-8'>Latest Products</h1>
          <Row>
            {[...data.products]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((product) => (
                <Col
                  key={product._id}
                  sm={12}
                  md={6}
                  lg={4}
                  xl={3}
                  className='p-2 bg-white rounded'
                >
                  <Product product={product}></Product>
                </Col>
              ))}
          </Row>
          <div className='d-flex mt-4 justify-content-center'>
            <Paginate
              pages={data.pages}
              page={data.page}
              keyword={keyword ? keyword : ''}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default HomeScreen;
