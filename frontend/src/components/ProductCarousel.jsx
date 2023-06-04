import React from 'react';
import { Link } from 'react-router-dom';
import { Carousel, Image } from 'react-bootstrap';
import Message from './Message';
import { useGetTopProductsQuery } from '../slices/productsApiSlice';

const ProductCarousel = () => {
  const { data: products, isLoading, error } = useGetTopProductsQuery();

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <Message variant='danger'>{error?.data?.message || error.error}</Message>
    );
  }

  return (
    <Carousel pause='hover' className='bg-white mb-4 border-bottom border-4'>
      {products.map((product) => (
        <Carousel.Item key={product._id}>
          <Link to={`/product/${product._id}`}>
            <Image
              src={product.image}
              alt={product.name}
              style={{
                width: '400px',
                height: '300px',
                objectFit: 'contain',
                position: 'relative',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />

            <Carousel.Caption className='carousel-caption'>
              <h5>
                {product.name} (${product.price})
              </h5>
            </Carousel.Caption>
          </Link>
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

export default ProductCarousel;
