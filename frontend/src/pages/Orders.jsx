import { useEffect, useState } from 'react'
import { Alert, Container, Spinner } from 'react-bootstrap'
import { Link, Navigate, useLocation } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
import { startPayment } from '../payment'

const money = (v) => `₹${Number(v).toLocaleString('en-IN')}`

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export default function Orders() {
  const { user, ready } = useAuth()
  const location = useLocation()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (!user) return
    api
      .get('/orders/')
      .then((res) => setOrders(res.data))
      .catch(() => setError('Could not load your orders.'))
  }, [user])

  const replaceOrder = (updated) =>
    setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)))

  const payNow = async (order) => {
    setBusyId(order.id)
    setNotice('')
    try {
      const outcome = await startPayment(order.id, user)
      if (outcome === 'paid') {
        const res = await api.get(`/orders/${order.id}/`)
        replaceOrder(res.data)
        setNotice('Payment received. Thank you!')
      }
    } catch (err) {
      setNotice(
        err.response?.data?.detail || err.message || 'Payment could not be completed.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const cancelOrder = async (order) => {
    if (!window.confirm('Cancel this order?')) return
    setBusyId(order.id)
    setNotice('')
    try {
      const res = await api.post(`/orders/${order.id}/cancel/`)
      replaceOrder(res.data)
      setNotice('Order cancelled.')
    } catch (err) {
      setNotice(err.response?.data?.detail || 'Could not cancel the order.')
    } finally {
      setBusyId(null)
    }
  }

  if (!ready) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" state={{ from: '/orders' }} replace />
  if (error) return <p className="text-center text-danger py-5">{error}</p>
  if (!orders) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <Container className="text-center py-5">
        <h1 className="detail-title">No orders yet</h1>
        <p className="detail-desc">Your orders will show up here.</p>
        <Link to="/" className="btn add-btn cart-empty-btn">Start shopping</Link>
      </Container>
    )
  }

  return (
    <Container className="py-5 order-wrap">
      <h1 className="detail-title mb-4">Your orders</h1>
      {notice && <Alert variant="info">{notice}</Alert>}

      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-head">
            <div>
              <div className="order-id">Order #{order.id}</div>
              <div className="cart-meta">{formatDate(order.created_at)}</div>
            </div>
            <span className={`status-badge status-${order.status}`}>
              {order.status}
            </span>
          </div>

          {order.items.map((item) => (
            <div key={item.id} className="summary-line">
              <span>
                {item.product_name} ({item.size}) × {item.quantity}
              </span>
              <span>{money(item.line_total)}</span>
            </div>
          ))}

          <div className="summary-line summary-total">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>

          {order.status === 'pending' && (
            <div className="order-actions">
              <button
                type="button"
                className="btn add-btn"
                disabled={busyId === order.id}
                onClick={() => payNow(order)}
              >
                {busyId === order.id ? 'Please wait...' : 'Pay now'}
              </button>
              <button
                type="button"
                className="link-btn"
                disabled={busyId === order.id}
                onClick={() => cancelOrder(order)}
              >
                Cancel order
              </button>
            </div>
          )}
        </div>
      ))}
    </Container>
  )
}