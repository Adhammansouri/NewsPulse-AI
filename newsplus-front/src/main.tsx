import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { applyThemeToDocument, getTheme } from "@/services/themeStore";
import "./index.css";

applyThemeToDocument(getTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
