import { useEffect, useState } from 'react'
import { Col, Container, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../api'
import heroImg from '../assets/hero.jpg'

const PAGE_SIZE = 12 // keep this equal to PAGE_SIZE in the Django settings
const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

export default function Home() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [category, setCategory] = useState('')
  const [size, setSize] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api
      .get('/categories/')
      .then((res) => setCategories(res.data))
      .catch(() => {})
  }, [])

  // Wait 400 ms after the last keystroke before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchText.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchText])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    api
      .get('/products/', {
        params: {
          category: category || undefined,
          size: size || undefined,
          search: search || undefined,
          ordering,
          page,
        },
      })
      .then((res) => {
        if (cancelled) return
        setProducts(res.data.results)
        setCount(res.data.count)
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load products. Is the Django server running?')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [category, size, search, ordering, page])

  const changeCategory = (slug) => {
    setCategory(slug)
    setPage(1)
  }
  const changeSize = (value) => {
    setSize(value)
    setPage(1)
  }
  const changeOrdering = (value) => {
    setOrdering(value)
    setPage(1)
  }
  const clearFilters = () => {
    setCategory('')
    setSize('')
    setOrdering('-created_at')
    setSearchText('')
    setSearch('')
    setPage(1)
  }
  const goToPage = (p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const hasFilters =
    category || size || search || ordering !== '-created_at'

  return (
    <>
            <section
        className="hero-banner"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="hero-overlay">
          <h1>Dhaga</h1>
          <p>Simple, honest clothing. Made to be worn often.</p>
          <a href="#shop" className="hero-btn">Shop now</a>
        </div>
      </section>

      <Container className="pb-5">
          <div className="filter-bar" id="shop">
          <div className="chips">
            <button
              type="button"
              className={`chip ${category === '' ? 'active' : ''}`}
              onClick={() => changeCategory('')}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${category === c.slug ? 'active' : ''}`}
                onClick={() => changeCategory(c.slug)}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="filter-controls">
            <input
              className="search-input"
              type="search"
              placeholder="Search clothes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <select
              className="select-input"
              value={size}
              onChange={(e) => changeSize(e.target.value)}
            >
              <option value="">All sizes</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  Size {s}
                </option>
              ))}
            </select>
            <select
              className="select-input"
              value={ordering}
              onChange={(e) => changeOrdering(e.target.value)}
            >
              <option value="-created_at">Newest</option>
              <option value="price">Price: low to high</option>
              <option value="-price">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className="result-line">
          <span>
            {loading ? 'Loading...' : `${count} product${count === 1 ? '' : 's'}`}
          </span>
          {hasFilters && (
            <button type="button" className="link-btn mt-0" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {loading && products.length === 0 && (
          <div className="text-center py-5">
            <Spinner animation="border" size="sm" />
          </div>
        )}
        {error && <p className="text-center text-danger">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-5">
            <p className="detail-desc">No products match your filters.</p>
            <button type="button" className="link-btn" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}

        <Row className="g-4" style={{ opacity: loading ? 0.5 : 1 }}>
          {products.map((p) => (
            <Col key={p.id} xs={6} md={4} lg={3}>
              <Link to={`/products/${p.slug}`} className="product-card">
                <div className="product-img-wrap">
                  {p.is_new && <span className="badge-new">New</span>}
                  <img src={p.image} alt={p.name} />
                </div>
                <h3 className="product-name">{p.name}</h3>
                <div className="product-category">{p.category.name}</div>
                <div>
                  <span className="price-now">
                    ₹{p.discount_price || p.price}
                  </span>
                  {p.discount_price && (
                    <span className="price-old">₹{p.price}</span>
                  )}
                </div>
              </Link>
            </Col>
          ))}
        </Row>

        {totalPages > 1 && (
          <div className="pagination-row">
            <button
              type="button"
              className="page-btn"
              disabled={page === 1}
              onClick={() => goToPage(page - 1)}
            >
              ← Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </Container>
    </>
  )
}