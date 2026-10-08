import { Route, Routes } from 'react-router-dom'
import SiteNavbar from './components/SiteNavbar'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'

export default function App() {
  return (
    <>
      <SiteNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
      </Routes>
    </>
  )
}