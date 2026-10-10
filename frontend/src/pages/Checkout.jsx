import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap'
import { Navigate, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
import { useCart } from '../CartContext'
import { startPayment } from '../payment'

const money = (v) => `₹${Number(v).toLocaleString('en-IN')}`

export default function Checkout() {
  const { user, ready } = useAuth()
  const { cart, refreshCart } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  })
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setForm((f) =>
        f.full_name
          ? f
          : {
              ...f,
              full_name: `${user.first_name} ${user.last_name}`.trim(),
            },
      )
    }
  }, [user])

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  if (!ready || (user && !cart)) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: '/checkout' }} replace />
  }

  if (cart.items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors([])
    setSubmitting(true)

    try {
      const res = await api.post('/orders/', form)
      const orderId = res.data.id

      let outcome = 'dismissed'
      let notice =
        'Your order is saved. Complete the payment or cancel it below.'

      try {
        outcome = await startPayment(orderId, user)
      } catch (payErr) {
        notice =
          payErr.response?.data?.detail ||
          payErr.message ||
          'Payment could not be completed.'
        outcome = 'error'
      }

      if (outcome === 'paid') {
        navigate(`/order-success/${orderId}`, { replace: true })
      } else {
        navigate('/orders', {
          replace: true,
          state: { notice },
        })
      }

      refreshCart()
    } catch (err) {
      const data = err.response?.data

      if (data?.detail) {
        setErrors([data.detail])
      } else if (data && typeof data === 'object') {
        setErrors(
          Object.entries(data).map(
            ([field, msgs]) =>
              `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`,
          ),
        )
      } else {
        setErrors(['Something went wrong. Try again.'])
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container className="py-5">
      <h1 className="detail-title mb-4">Checkout</h1>

      <Row className="g-5">
        <Col lg={7}>
          <h2 className="checkout-heading">Delivery details</h2>

          {errors.length > 0 && (
            <Alert variant="danger">
              {errors.map((m) => (
                <div key={m}>{m}</div>
              ))}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="checkout-form">
            <Form.Group className="mb-3">
              <Form.Label>Full name</Form.Label>
              <Form.Control
                name="full_name"
                value={form.full_name}
                onChange={update}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone (10 digits)</Form.Label>
              <Form.Control
                name="phone"
                value={form.phone}
                onChange={update}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="address"
                value={form.address}
                onChange={update}
                required
              />
            </Form.Group>

            <Row>
              <Col>
                <Form.Group className="mb-4">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    name="city"
                    value={form.city}
                    onChange={update}
                    required
                  />
                </Form.Group>
              </Col>

              <Col>
                <Form.Group className="mb-4">
                  <Form.Label>Pincode (6 digits)</Form.Label>
                  <Form.Control
                    name="pincode"
                    value={form.pincode}
                    onChange={update}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button
              type="submit"
              className="add-btn mt-0"
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Pay now'}
            </Button>
          </Form>
        </Col>

        <Col lg={5}>
          <div className="summary-card">
            <h2>Your order</h2>

            {cart.items.map((item) => (
              <div key={item.id} className="summary-line">
                <span>
                  {item.product_name} ({item.size}) × {item.quantity}
                </span>
                <span>{money(item.line_total)}</span>
              </div>
            ))}

            <div className="summary-line summary-total">
              <span>Total</span>
              <span>{money(cart.total)}</span>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}
