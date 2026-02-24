import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store } from "@/store";
import App from "./App";
import "./index.css";
import "@livekit/components-styles";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <TooltipProvider delayDuration={300}>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(222.2 84% 4.9%)",
                color: "hsl(210 40% 98%)",
                border: "1px solid hsl(217.2 32.6% 17.5%)",
                borderRadius: "0.75rem",
              },
            }}
          />
        </TooltipProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);