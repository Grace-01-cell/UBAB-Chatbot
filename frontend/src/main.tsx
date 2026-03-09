import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import Viewer from "./viewer";

const path = window.location.pathname;
const RootComponent = path === "/viewer" ? Viewer : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>
);