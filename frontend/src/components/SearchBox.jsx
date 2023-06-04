import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const SearchBox = () => {
  const navigate = useNavigate();
  const { keyword: urlKeyword } = useParams();
  const [keyword, setKeyword] = useState(urlKeyword || '');

  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      setKeyword('');
      navigate(`/search/${keyword}`);
    } else {
      navigate('/');
    }
  };

  return (
    <Form onSubmit={submitHandler} className='d-flex'>
      <Form.Control
        type='text'
        name='q'
        onChange={(e) => setKeyword(e.target.value)}
        placeholder='Search Products...'
        className='mr-sm-2 ml-sm-5 border-bottom'
        value={keyword}
        style={{
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
        }}
      ></Form.Control>
      <Button
        type='submit'
        className='p-2 mx-2 bg-light'
        style={{
          border: 'none',
          color: '#000',
        }}
      >
        <FaSearch />
      </Button>
    </Form>
  );
};

export default SearchBox;
