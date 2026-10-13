import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { toast } from 'react-toastify';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useDeleteProductMutation,
} from '../../slices/productsApiSlice';
import Paginate from '../../components/Paginate';
import Meta from '../../components/Meta';

const ProductListScreen = () => {
  const { pageNumber = 1 } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetProductsQuery({
    pageNumber,
  });

  const [createProduct, { isLoading: loadingCreate }] =
    useCreateProductMutation();

  const [deleteProduct, { isLoading: loadingDelete }] =
    useDeleteProductMutation();

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to remove this product?')) {
      try {
        await deleteProduct(id).unwrap();
        toast.success('Product removed');
        refetch();
      } catch (error) {
        toast.error(error?.data?.message || error.error);
      }
    }
  };

  const createProductHandler = async () => {
    if (window.confirm('Are you sure you want to add a new product?')) {
      try {
        const created = await createProduct().unwrap();
        navigate(`/admin/product/${created._id}/edit`);
      } catch (error) {
        toast.error(error?.data?.message || error.error);
      }
    }
  };

  return (
    <>
      <Meta title={'TechShop Products'} />
      <Row className="align-items-center">
        <Col>
          <h1>Products</h1>
        </Col>
        <Col className="text-end">
          <Button
            className="btn-sm m-3"
            onClick={createProductHandler}
            style={{
              backgroundColor: '#D3592A',
              border: 'none',
            }}
          >
            <FaEdit
              style={{
                marginBottom: '3px',
                marginRight: '5px',
              }}
            />
            Add product
          </Button>
        </Col>
      </Row>
      {loadingCreate && <Loader />}
      {loadingDelete && <Loader />}
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          <Table striped bordered hover responsive className="table-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>PRICE</th>
                <th>CATEGORY</th>
                <th>BRAND</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((product) => (
                <tr key={product._id}>
                  <td>{product._id}</td>
                  <td>{product.name}</td>
                  <td>$ {product.price}</td>
                  <td>{product.category}</td>
                  <td>{product.brand}</td>
                  <td>
                    <LinkContainer to={`/admin/product/${product._id}/edit`}>
                      <Button variant="light" className="btn-sm mx-2">
                        <FaEdit aria-label="Edit" />
                      </Button>
                    </LinkContainer>
                    <Button
                      variant="danger"
                      className="btn-sm"
                      onClick={() => deleteHandler(product._id)}
                    >
                      <FaTrash aria-label="Remove" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Paginate pages={data.pages} page={data.page} isAdmin={true} />
        </>
      )}
    </>
  );
};

export default ProductListScreen;
