import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { ListPage } from "./pages/ListPage";
import { DetailPage } from "./pages/DetailPage";
function getRouteFromHash() {
    if (typeof window === "undefined")
        return "home";
    const h = window.location.hash.replace(/^#\//, "").replace(/^#/, "");
    const route = h.split("?")[0];
    return route === "detail" ? "detail" : "home";
}
export function App() {
    const [route, setRoute] = useState(getRouteFromHash());
    useEffect(() => {
        const onHash = () => setRoute(getRouteFromHash());
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, []);
    if (route === "detail") {
        return (_jsx("div", { className: "app", children: _jsx(DetailPage, {}) }));
    }
    return (_jsxs("div", { className: "app", children: [_jsx("section", { children: _jsx(HomePage, {}) }), _jsx("section", { style: { marginTop: 16 }, children: _jsx(ListPage, {}) })] }));
}
