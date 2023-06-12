import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Rating from './Rating';

const Product = ({ product }) => {
  return (
    <Card className='p-2 rounded shadow shadow-4'>
      <Link to={`/product/${product._id}`}>
        <Card.Img
          src={product.image}
          variant='top'
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'contain',
          }}
        />
      </Link>
      <Card.Body>
        <Link
          to={`/product/${product._id}`}
          style={{
            textDecoration: 'none',
            color: '#000',
          }}
        >
          <Card.Title as='div'>
            <p className='product-title-text'>{product.name}</p>
          </Card.Title>
        </Link>
        <Card.Text as='div'>
          <Rating
            value={product.rating}
            text={`${product.numReviews} reviews.`}
          />
        </Card.Text>
        <Card.Text as='h3'>${product.price}</Card.Text>
      </Card.Body>
    </Card>
  );
};

export default Product;
