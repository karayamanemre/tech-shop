import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaGithub } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: FaGithub, url: 'https://github.com/karayamanemre/tech-shop' },
  ];

  return (
    <footer
      style={{ backgroundColor: '#ffffff', color: '#657A8C' }}
      className='border-top border-3'
    >
      <Container>
        <Row>
          <Col className='text-center p-2'>
            <p>TechShop &copy; {currentYear}</p>
            <div>
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{ color: '#657A8C' }}
                >
                  <link.icon size={30} />
                </a>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
