import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <Container className="d-flex flex-column flex-md-row justify-content-between gap-3">
        <div>
          <div className="footer-brand">Dhaga</div>
          <div>Simple, honest clothing.</div>
        </div>

        <div className="footer-links">
          <Link to="/">Shop</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/orders">Orders</Link>
        </div>

        <div>
          <div>Photos from Unsplash.</div>
          <div>Demo store: payments run in Razorpay test mode.</div>
          <div>© {new Date().getFullYear()} Dhaga</div>
        </div>
      </Container>
    </footer>
  )
}