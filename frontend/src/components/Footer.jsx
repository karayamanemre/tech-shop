import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer
      style={{
        backgroundColor: '#657A8C',
        color: '#DCE0E4',
      }}
    >
      <Container>
        <Row>
          <Col className="text-center py-3">
            <p>TechShop &copy; {currentYear}</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
