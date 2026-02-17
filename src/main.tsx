import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/notifications";

// Register service worker for PWA & push notifications
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
