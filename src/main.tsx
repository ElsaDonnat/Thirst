import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Fonts are bundled so the app renders identically offline
import "@fontsource/lilita-one/400.css";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/fredoka/700.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import { initNative } from "./lib/native";

initNative();

createRoot(document.getElementById("root")!).render(<App />);
