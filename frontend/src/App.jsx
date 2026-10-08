import { Route, Routes } from 'react-router-dom'
import SiteNavbar from './components/SiteNavbar'
import Home from './pages/Home'

export default function App() {
  return (
    <>
      <SiteNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  )
}