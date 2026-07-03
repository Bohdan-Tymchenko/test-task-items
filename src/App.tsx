import { Container } from '@mui/material'
import { useAppSelector } from './store/hooks'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/loginPage'
import { ItemsPage } from './pages/itemsPage'

function App() {
  const isAuthenticated = useAppSelector((state) => state.auth.session !== null);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/items" /> : <LoginPage />} />
        <Route path="/items" element={isAuthenticated ? <ItemsPage /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Container>
  )
}

export default App
