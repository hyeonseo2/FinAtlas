import { jsxs as _jsxs } from "react/jsx-runtime";
import { fmtRate } from "../lib/format";
export function RateBadge({ label, value }) {
    return _jsxs("span", { className: "badge blue", children: [label, ": ", fmtRate(value)] });
}
