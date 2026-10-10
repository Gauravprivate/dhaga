import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <Container className="text-center py-5">
      <h1 className="detail-title">Page not found</h1>
      <p className="detail-desc">The page you are looking for does not exist.</p>
      <Link to="/" className="btn add-btn cart-empty-btn">Back to shop</Link>
    </Container>
  )
}