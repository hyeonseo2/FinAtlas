import { useHash } from "./lib/interest";
import { HomePage } from "./pages/HomePage";
import { ListPage } from "./pages/ListPage";
import { ComparePage } from "./pages/ComparePage";
import { DetailPage } from "./pages/DetailPage";

function Nav({ goto, route }: { goto: (r: string) => void; route: string }) {
  const navButton = (target: string, label: string) => (
    <button
      type="button"
      className={`nav-btn ${route === target ? "active" : ""}`}
      onClick={() => goto(target)}
    >
      {label}
    </button>
  );

  return (
    <div className="card navbar topline" style={{ marginBottom: 16 }}>
      <div>
        <h1>finatlas</h1>
        <div className="brand-badge">예금/적금 현실금리 비교 서비스</div>
      </div>
      <div className="actions nav-row">
        {navButton("home", "홈")}
        {navButton("list", "상품")}
        {navButton("detail", "상세")}
        {navButton("compare", "비교")}
      </div>
    </div>
  );
}

export function App() {
  const { route, setRoute } = useHash("home");

  return (
    <div className="app">
      <Nav goto={setRoute} route={route} />
      {route === "home" && <HomePage />}
      {route === "list" && <ListPage />}
      {route === "detail" && <DetailPage />}
      {route === "compare" && <ComparePage />}
    </div>
  );
}
