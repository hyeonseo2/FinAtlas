import { jsx as _jsx } from "react/jsx-runtime";
import { difficultyLabel, toDisplayDifficulty } from "../lib/difficulty";
export function DifficultyBadge({ score }) {
    const display = toDisplayDifficulty(score);
    const grade = difficultyLabel(display);
    const tone = display <= 40 ? "green" : display <= 80 ? "blue" : "purple";
    return _jsx("span", { className: `badge ${tone}`, children: grade });
}
