import api from './api'

// Opens the Razorpay popup for an existing pending order.
// Resolves 'paid' after the backend verifies the payment, or 'dismissed'
// if the customer closes the popup. Rejects if something fails.
export async function startPayment(orderId, user) {
  if (!window.Razorpay) {
    throw new Error('Payment script did not load. Check your internet and refresh.')
  }

  const { data } = await api.post(`/orders/${orderId}/pay/`)

  return new Promise((resolve, reject) => {
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpay_order_id,
      name: 'Dhaga',
      description: `Order #${orderId}`,
      prefill: {
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
      },
      theme: { color: '#B5654A' },
      handler: async (response) => {
        try {
          await api.post(`/orders/${orderId}/verify/`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          resolve('paid')
        } catch (err) {
          reject(err)
        }
      },
      modal: { ondismiss: () => resolve('dismissed') },
    }

    new window.Razorpay(options).open()
  })
}