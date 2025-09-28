import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SidebarProvider } from "@/components/ui/sidebar"

document.body.classList.add('dark')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SidebarProvider>       
      <App />
    </SidebarProvider>
  </StrictMode>,
)
