// Shared utility functions for speedcubing cheat sheets

const SVG_NS = "http://www.w3.org/2000/svg";
const faceColors = {
    y: "#f7d84a",
    w: "#f5f7fb",
    g: "#31b45b",
    G: "#b8c0cf",
    b: "#3567d9",
    r: "#dc4b4b",
    o: "#f08a3a"
};

function makeSvgEl(name, attrs) {
    const el = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
        el.setAttribute(key, value);
    });
    return el;
}

function oppositeDirection(dir) {
    const opposites = { up: "down", down: "up", left: "right", right: "left" };
    return opposites[dir] || dir;
}

function directionForMove(move) {
    const face = (move.match(/[URFDLB]/i) || ["F"])[0].toUpperCase();
    const clockwiseByFace = {
        U: "left",
        D: "left",
        R: "up",
        L: "down",
        F: "right",
        B: "left"
    };
    const base = clockwiseByFace[face] || "right";
    return move.includes("'") ? oppositeDirection(base) : base;
}

function highlightRectForFace(face, cubeSize = 3) {
    const size = Math.max(2, Math.min(6, Number(cubeSize) || 3));
    const gridStart = 6;
    const gridSpan = 24;
    const cell = gridSpan / size;
    const format = (value) => Number(value.toFixed(2)).toString();

    const centerRect = () => {
        if (size % 2 === 1) {
            const center = Math.floor(size / 2);
            return {
                x: format(gridStart + center * cell),
                y: format(gridStart + center * cell),
                width: format(cell),
                height: format(cell)
            };
        }

        const start = size / 2 - 1;
        return {
            x: format(gridStart + start * cell),
            y: format(gridStart + start * cell),
            width: format(cell * 2),
            height: format(cell * 2)
        };
    };

    const rects = {
        U: { x: format(gridStart), y: format(gridStart), width: format(gridSpan), height: format(cell) },
        D: {
            x: format(gridStart),
            y: format(gridStart + gridSpan - cell),
            width: format(gridSpan),
            height: format(cell)
        },
        R: {
            x: format(gridStart + gridSpan - cell),
            y: format(gridStart),
            width: format(cell),
            height: format(gridSpan)
        },
        L: { x: format(gridStart), y: format(gridStart), width: format(cell), height: format(gridSpan) },
        F: centerRect(),
        B: {
            x: format(gridStart + cell * 0.5),
            y: format(gridStart + cell * 0.5),
            width: format(gridSpan - cell),
            height: format(gridSpan - cell)
        }
    };

    return rects[face] || rects.F;
}

function addArrowToSvg(svg, direction) {
    const arrows = {
        up: { line: "18 24 18 12", head: "18,10 14.8,14.2 21.2,14.2" },
        down: { line: "18 12 18 24", head: "18,26 14.8,21.8 21.2,21.8" },
        left: { line: "24 18 12 18", head: "10,18 14.2,14.8 14.2,21.2" },
        right: { line: "12 18 24 18", head: "26,18 21.8,14.8 21.8,21.2" }
    };
    const cfg = arrows[direction] || arrows.right;
    const lineParts = cfg.line.split(" ");

    svg.appendChild(makeSvgEl("line", {
        x1: lineParts[0],
        y1: lineParts[1],
        x2: lineParts[2],
        y2: lineParts[3],
        stroke: "#1f3f92",
        "stroke-width": "2",
        "stroke-linecap": "round"
    }));

    svg.appendChild(makeSvgEl("polygon", {
        points: cfg.head,
        fill: "#1f3f92"
    }));
}

function createMoveSvg(move, cubeSize = 3) {
    const face = (move.match(/[URFDLB]/i) || ["F"])[0].toUpperCase();
    const size = Math.max(2, Math.min(6, Number(cubeSize) || 3));
    const gridStart = 6;
    const gridEnd = 30;
    const gridSpan = gridEnd - gridStart;
    const cell = gridSpan / size;
    const svg = makeSvgEl("svg", {
        class: "move-icon",
        viewBox: "0 0 36 36",
        "aria-hidden": "true",
        focusable: "false"
    });

    svg.appendChild(makeSvgEl("rect", {
        x: "2",
        y: "2",
        width: "48",
        height: "48",
        rx: "6",
        fill: "#f4f7ff",
        stroke: "#90a5d6",
        "stroke-width": "1"
    }));

    const hl = highlightRectForFace(face, size);
    svg.appendChild(makeSvgEl("rect", {
        ...hl,
        rx: "1.8",
        fill: "#c8d6f9"
    }));

    for (let i = 1; i < size; i += 1) {
        const offset = gridStart + cell * i;
        const offsetText = Number(offset.toFixed(2)).toString();

        svg.appendChild(makeSvgEl("line", {
            x1: offsetText,
            y1: String(gridStart),
            x2: offsetText,
            y2: String(gridEnd),
            stroke: "#b7c6ea",
            "stroke-width": "1"
        }));

        svg.appendChild(makeSvgEl("line", {
            x1: String(gridStart),
            y1: offsetText,
            x2: String(gridEnd),
            y2: offsetText,
            stroke: "#b7c6ea",
            "stroke-width": "1"
        }));
    }

    addArrowToSvg(svg, directionForMove(move));

    if (move.includes("2")) {
        svg.appendChild(makeSvgEl("text", {
            x: "28",
            y: "12",
            fill: "#203f8f",
            "font-size": "8",
            "font-family": "Menlo, Consolas, monospace",
            "font-weight": "700",
            "text-anchor": "middle"
        })).textContent = "2";
    }

    return svg;
}

function createMoveEl(move, cubeSize = 3) {
    const moveEl = document.createElement("span");
    moveEl.className = "move";
    const normalizedMove = String(move || "").trim();
    if (!normalizedMove.endsWith("2")) {
        moveEl.appendChild(createMoveSvg(normalizedMove, cubeSize));
    }

    const label = document.createElement("span");
    label.className = "move-text";
    label.textContent = normalizedMove;
    moveEl.appendChild(label);

    return moveEl;
}

function colorFromCode(code) {
    const raw = String(code || "").trim();
    if (Object.prototype.hasOwnProperty.call(faceColors, raw)) {
        return faceColors[raw];
    }
    return faceColors[raw.toLowerCase()] || "#d9e0f2";
}

// Export for browser global usage
window.speedcubingUtils = {
    makeSvgEl,
    oppositeDirection,
    directionForMove,
    highlightRectForFace,
    addArrowToSvg,
    createMoveSvg,
    createMoveEl,
    colorFromCode,
    faceColors,
    SVG_NS
};
