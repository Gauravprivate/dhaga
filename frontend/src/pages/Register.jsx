import { useState } from 'react'
import { Alert, Button, Col, Container, Form, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors([])
    setSubmitting(true)
    try {
      await api.post('/auth/register/', form)
      await login(form.username, form.password)
      navigate('/', { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setErrors(
          Object.entries(data).map(
            ([field, msgs]) =>
              `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`,
          ),
        )
      } else {
        setErrors(['Something went wrong. Try again.'])
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container className="auth-wrap">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="auth-sub">Join Dhaga to save your cart and track orders.</p>

        {errors.length > 0 && (
          <Alert variant="danger">
            {errors.map((m) => (
              <div key={m}>{m}</div>
            ))}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>First name</Form.Label>
                <Form.Control name="first_name" value={form.first_name} onChange={update} />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Last name</Form.Label>
                <Form.Control name="last_name" value={form.last_name} onChange={update} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control name="username" value={form.username} onChange={update} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" name="email" value={form.email} onChange={update} required />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" name="password" value={form.password} onChange={update} required />
          </Form.Group>
          <Button type="submit" className="add-btn mt-0" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create account'}
          </Button>
        </Form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </Container>
  )
}