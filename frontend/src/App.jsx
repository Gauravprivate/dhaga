import { Route, Routes } from 'react-router-dom'
import SiteNavbar from './components/SiteNavbar'
import Cart from './pages/Cart'
import Home from './pages/Home'
import Login from './pages/Login'
import ProductDetail from './pages/ProductDetail'
import Register from './pages/Register'

export default function App() {
  return (
    <>
      <SiteNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  )
}