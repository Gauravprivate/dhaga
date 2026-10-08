import { Container, Navbar } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function SiteNavbar() {
  return (
    <Navbar className="site-nav py-3">
      <Container className="d-flex justify-content-between align-items-center">
        <Link to="/" className="brand">Dhaga</Link>
        <Link to="/" className="nav-link-custom">Shop</Link>
      </Container>
    </Navbar>
  )
}