import { Container, Navbar } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useCart } from '../CartContext'

export default function SiteNavbar() {
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Navbar className="site-nav py-3">
      <Container className="d-flex justify-content-between align-items-center">
        <Link to="/" className="brand">Dhaga</Link>

        <div className="d-flex align-items-center gap-4">
          <Link to="/" className="nav-link-custom">Shop</Link>
          {user ? (
            <>
              <Link to="/cart" className="nav-link-custom">
                Cart ({cart ? cart.item_count : 0})
              </Link>
              <Link to="/orders" className="nav-link-custom">Orders</Link>
              <span className="nav-link-custom">
                Hi, {user.first_name || user.username}
              </span>
              <button className="nav-link-custom nav-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link-custom">Login</Link>
              <Link to="/register" className="nav-link-custom">Register</Link>
            </>
          )}
        </div>
      </Container>
    </Navbar>
  )
}