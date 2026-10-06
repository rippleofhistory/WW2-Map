import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";
import "./index.css";
import App from "./App.tsx";
import { SnippetPage } from "./components/SnippetPage.tsx";
import { DataProvider } from "./data/DataProvider.tsx";
import { readRoute } from "./lib/embed.ts";

const route = readRoute(window.location.pathname);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {route === "snippet" ? (
      <SnippetPage />
    ) : (
      <DataProvider>
        <App embed={route === "embed"} />
      </DataProvider>
    )}
  </StrictMode>,
);
