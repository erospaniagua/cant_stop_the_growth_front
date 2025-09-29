import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserProvider } from "@/context/UserContext"


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SidebarProvider>
       <UserProvider>
          <App />
        </UserProvider>
      </SidebarProvider>
    </ThemeProvider>
  </StrictMode>,
)
