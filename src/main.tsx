import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.tsx'
import { store } from './store/index.ts'
import './index.css'
import { apiClient } from './api/apiClient.ts'
import { sessionChanged } from './store/auth/authSlice.ts'
import { BrowserRouter } from 'react-router-dom'

// subscribe to session changes and dispatch the action to the store
apiClient.subscribe((session) => {
  store.dispatch(sessionChanged(session));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
