import { useEffect, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { ListPage } from "./pages/ListPage";
import { ComparePage } from "./pages/ComparePage";
import { DetailPage } from "./pages/DetailPage";

function getRouteFromHash(): string {
  if (typeof window === "undefined") return "home";
  const h = window.location.hash.replace(/^#\//, "").replace(/^#/, "");
  const route = h.split("?")[0];
  return route === "detail" ? "detail" : "home";
}

export function App() {
  const [route, setRoute] = useState<string>(getRouteFromHash());

  useEffect(() => {
    const onHash = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (route === "detail") {
    return (
      <div className="app">
        <DetailPage />
      </div>
    );
  }

  return (
    <div className="app">
      <section>
        <HomePage />
      </section>
      <section style={{ marginTop: 16 }}>
        <ComparePage />
      </section>
      <section style={{ marginTop: 16 }}>
        <ListPage />
      </section>
    </div>
  );
}
