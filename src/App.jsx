import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './features/auth'
import AppRoutes from './router/AppRoutes'

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
