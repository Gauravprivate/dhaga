import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from './api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(null)

  const refreshCart = useCallback(async () => {
    if (!localStorage.getItem('access')) {
      setCart(null)
      return
    }
    try {
      const res = await api.get('/cart/')
      setCart(res.data)
    } catch {
      setCart(null)
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [user, refreshCart])

  return (
    <CartContext.Provider value={{ cart, setCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)