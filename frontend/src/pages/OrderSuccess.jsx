import { useEffect, useState } from 'react'
import { Container, Spinner } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import api from '../api'

const money = (v) => `₹${Number(v).toLocaleString('en-IN')}`

export default function OrderSuccess() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/orders/${id}/`)
      .then((res) => setOrder(res.data))
      .catch(() => setError('Order not found.'))
  }, [id])

  if (error) return <p className="text-center text-danger py-5">{error}</p>
  if (!order) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" />
      </div>
    )
  }

  return (
    <Container className="py-5 order-wrap">
      <div className="text-center mb-4">
        <h1 className="detail-title">Thank you, payment received</h1>
        <p className="detail-desc">
          Order #{order.id} · Status: {order.status}
        </p>
      </div>

      <div className="summary-card">
        <h2>Items</h2>
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

        <h2 className="mt-4">Delivering to</h2>
        <p className="detail-desc mb-0">
          {order.full_name}
          <br />
          {order.address}, {order.city} {order.pincode}
          <br />
          {order.phone}
        </p>
      </div>

      <div className="text-center mt-4">
        <Link to="/" className="btn add-btn cart-empty-btn">
          Continue shopping
        </Link>
      </div>
    </Container>
  )
}