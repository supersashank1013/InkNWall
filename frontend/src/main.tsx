import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId="361354197705-g1qcln0tmsh4c1k4h25qpahp8j9canss.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
)
