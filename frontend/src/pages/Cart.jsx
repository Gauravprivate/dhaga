import { useState } from 'react'
import { Alert, Col, Container, Row, Spinner } from 'react-bootstrap'
import { Link, Navigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
import { useCart } from '../CartContext'

const money = (v) => `₹${Number(v).toLocaleString('en-IN')}`

export default function Cart() {
  const { user, ready } = useAuth()
  const { cart, setCart } = useCart()
  const [error, setError] = useState('')

  if (!ready) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" state={{ from: '/cart' }} replace />
  if (!cart) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" />
      </div>
    )
  }

  const changeQty = async (item, quantity) => {
    if (quantity < 1) return
    setError('')
    try {
      const res = await api.patch(`/cart/items/${item.id}/`, { quantity })
      setCart(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update the cart.')
    }
  }

  const removeItem = async (item) => {
    setError('')
    try {
      const res = await api.delete(`/cart/items/${item.id}/`)
      setCart(res.data)
    } catch {
      setError('Could not remove the item.')
    }
  }

  if (cart.items.length === 0) {
    return (
      <Container className="text-center py-5">
        <h1 className="detail-title">Your cart is empty</h1>
        <p className="detail-desc">Find something you like and add it here.</p>
        <Link to="/" className="btn add-btn cart-empty-btn">Continue shopping</Link>
      </Container>
    )
  }

  return (
    <Container className="py-5">
      <h1 className="detail-title mb-4">Your cart</h1>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-5">
        <Col lg={8}>
          {cart.items.map((item) => (
            <div key={item.id} className="cart-row">
              <Link to={`/products/${item.product_slug}`} className="cart-thumb">
                <img src={item.image} alt={item.product_name} />
              </Link>

              <div className="cart-info">
                <Link to={`/products/${item.product_slug}`} className="cart-name">
                  {item.product_name}
                </Link>
                <div className="cart-meta">Size {item.size}</div>
                <div className="cart-meta">{money(item.unit_price)}</div>

                <div className="qty-row cart-qty">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => changeQty(item, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => changeQty(item, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="cart-right">
                <div className="price-now">{money(item.line_total)}</div>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => removeItem(item)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </Col>

        <Col lg={4}>
          <div className="summary-card">
            <h2>Order summary</h2>
            <div className="summary-line">
              <span>Items</span>
              <span>{cart.item_count}</span>
            </div>
            <div className="summary-line summary-total">
              <span>Total</span>
              <span>{money(cart.total)}</span>
            </div>
            <Link to="/checkout" className="btn add-btn">
              Proceed to checkout
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  )
}