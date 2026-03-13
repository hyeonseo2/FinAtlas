import { useEffect, useState } from "react";
export function useHash(initial) {
    const get = () => {
        const h = window.location.hash.replace(/^#\//, "").replace(/^#/, "");
        return ["home", "list", "compare", "detail"].includes(h.split("?")[0]) ? h.split("?")[0] : initial;
    };
    const [route, setRoute] = useState(get());
    useEffect(() => {
        const onHash = () => setRoute(get());
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, []);
    const go = (r) => {
        window.location.hash = `#/${r}`;
        setRoute(r);
    };
    return { route, setRoute: go };
}
export function getHashParam(name) {
    if (typeof window === "undefined")
        return null;
    const hash = window.location.hash.replace(/^#\//, "#/");
    const [_, query = ""] = hash.split("?");
    if (!query)
        return null;
    const params = new URLSearchParams(query);
    return params.get(name);
}
