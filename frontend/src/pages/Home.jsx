import { useEffect, useState } from 'react'
import { Col, Container, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/products/')
      .then((res) => setProducts(res.data.results))
      .catch(() => setError('Could not load products. Is the Django server running?'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <section className="hero">
        <h1>Dhaga</h1>
        <p>Simple, honest clothing. Made to be worn often.</p>
      </section>

      <Container className="pb-5">
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" size="sm" />
          </div>
        )}
        {error && <p className="text-center text-danger">{error}</p>}

        <Row className="g-4">
          {products.map((p) => (
            <Col key={p.id} xs={6} md={4} lg={3}>
              <Link to={`/products/${p.slug}`} className="product-card">
                <div className="product-img-wrap">
                  {p.is_new && <span className="badge-new">New</span>}
                  <img src={p.image} alt={p.name} />
                </div>
                <h3 className="product-name">{p.name}</h3>
                <div className="product-category">{p.category.name}</div>
                <div>
                  <span className="price-now">
                    ₹{p.discount_price || p.price}
                  </span>
                  {p.discount_price && (
                    <span className="price-old">₹{p.price}</span>
                  )}
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  )
}