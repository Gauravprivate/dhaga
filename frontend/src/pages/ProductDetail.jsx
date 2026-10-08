import { useEffect, useState } from 'react'
import { Alert, Button, Col, Container, Row, Spinner } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL']

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    setLoading(true)
    api
      .get(`/products/${slug}/`)
      .then((res) => setProduct(res.data))
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" />
      </div>
    )
  }
  if (error) return <p className="text-center text-danger py-5">{error}</p>

  const sizes = [...product.sizes].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size),
  )
  const selected = sizes.find((s) => s.size === size)
  const maxQty = selected ? selected.stock : 1

  const chooseSize = (s) => {
    setSize(s)
    setQuantity(1)
    setMessage(null)
  }

  const addToCart = async () => {
    if (!localStorage.getItem('access')) {
      navigate('/login', { state: { from: `/products/${slug}` } })
      return
    }
    if (!size) {
      setMessage({ variant: 'warning', text: 'Please select a size.' })
      return
    }
    try {
      await api.post('/cart/items/', {
        product_id: product.id,
        size,
        quantity,
      })
      setMessage({ variant: 'success', text: 'Added to your cart.' })
    } catch (err) {
      const text = err.response?.data?.detail || 'Something went wrong.'
      setMessage({ variant: 'danger', text })
    }
  }

  return (
    <Container className="py-5">
      <Row className="g-5">
        <Col md={6}>
          <div className="product-img-wrap">
            {product.is_new && <span className="badge-new">New</span>}
            <img src={product.image} alt={product.name} />
          </div>
        </Col>

        <Col md={6}>
          <div className="product-category">{product.category.name}</div>
          <h1 className="detail-title">{product.name}</h1>

          <div className="detail-price">
            <span className="price-now">
              ₹{product.discount_price || product.price}
            </span>
            {product.discount_price && (
              <span className="price-old">₹{product.price}</span>
            )}
          </div>

          {product.colour && (
            <p className="detail-meta">Colour: {product.colour}</p>
          )}
          <p className="detail-desc">{product.description}</p>

          <div className="detail-label">Size</div>
          <div className="size-row">
            {sizes.map((s) => (
              <button
                key={s.size}
                type="button"
                className={`size-btn ${size === s.size ? 'active' : ''}`}
                disabled={s.stock === 0}
                onClick={() => chooseSize(s.size)}
              >
                {s.size}
              </button>
            ))}
          </div>
          {selected && selected.stock <= 5 && (
            <p className="low-stock">Only {selected.stock} left</p>
          )}

          <div className="detail-label">Quantity</div>
          <div className="qty-row">
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="qty-value">{quantity}</span>
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            >
              +
            </button>
          </div>

          <Button className="add-btn" onClick={addToCart}>
            Add to cart
          </Button>

          {message && (
            <Alert variant={message.variant} className="mt-3">
              {message.text}
            </Alert>
          )}
        </Col>
      </Row>
    </Container>
  )
}