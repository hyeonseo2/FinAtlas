import { useHash } from "./lib/interest";
import { HomePage } from "./pages/HomePage";
import { ListPage } from "./pages/ListPage";
import { ComparePage } from "./pages/ComparePage";
import { DetailPage } from "./pages/DetailPage";

function Nav({ goto }: { goto: (r: string) => void }) {
  return (
    <div className="card topline" style={{ marginBottom: 16 }}>
      <h1>finatlas</h1>
      <div className="actions">
        <button onClick={() => goto("home")}>홈</button>
        <button onClick={() => goto("list")}>상품</button>
        <button onClick={() => goto("detail")}>상세</button>
        <button onClick={() => goto("compare")}>비교</button>
      </div>
    </div>
  );
}

export function App() {
  const { route, setRoute } = useHash("home");

  return (
    <div className="app">
      <Nav goto={setRoute} />
      {route === "home" && <HomePage />}
      {route === "list" && <ListPage />}
      {route === "detail" && <DetailPage />}
      {route === "compare" && <ComparePage />}
    </div>
  );
}
