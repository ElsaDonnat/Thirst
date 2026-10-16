import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { translate, type Lang, type StringKey } from "@/i18n/strings";

// This renders outside GameProvider (it has to survive the provider
// crashing), so it reads the saved language straight from storage
function text(key: StringKey) {
  let lang: Lang = "en";
  try {
    const saved = JSON.parse(localStorage.getItem("thirst-settings-v1") ?? "{}");
    if (saved.language === "fr") lang = "fr";
  } catch {
    // fall back to English
  }
  return translate(lang, key);
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-display text-3xl font-bold text-primary">{text("error.title")}</h1>
          <p className="text-base text-muted-foreground">{text("error.body")}</p>
          <Button onClick={() => window.location.reload()}>{text("error.restart")}</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
