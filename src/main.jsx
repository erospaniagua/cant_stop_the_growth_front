import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserProvider } from "@/context/UserContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AdminConfirmProvider } from "@/context/AdminConfirmContext";

import "./lib/i18n";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AdminConfirmProvider>
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <LanguageProvider>
              <App />
          </LanguageProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
    </AdminConfirmProvider>
  </StrictMode>
);
