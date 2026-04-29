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

function highlightRectForFace(face) {
    const rects = {
        U: { x: "8", y: "6", width: "20", height: "6" },
        D: { x: "8", y: "24", width: "20", height: "6" },
        R: { x: "24", y: "8", width: "6", height: "20" },
        L: { x: "6", y: "8", width: "6", height: "20" },
        F: { x: "12", y: "12", width: "12", height: "12" },
        B: { x: "11", y: "11", width: "14", height: "14" }
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

function createMoveSvg(move) {
    const face = (move.match(/[URFDLB]/i) || ["F"])[0].toUpperCase();
    const svg = makeSvgEl("svg", {
        class: "move-icon",
        viewBox: "0 0 36 36",
        "aria-hidden": "true",
        focusable: "false"
    });

    svg.appendChild(makeSvgEl("rect", {
        x: "2",
        y: "2",
        width: "32",
        height: "32",
        rx: "6",
        fill: "#f4f7ff",
        stroke: "#90a5d6",
        "stroke-width": "1"
    }));

    const hl = highlightRectForFace(face);
    svg.appendChild(makeSvgEl("rect", {
        ...hl,
        rx: "1.8",
        fill: "#c8d6f9"
    }));

    svg.appendChild(makeSvgEl("line", { x1: "13", y1: "6", x2: "13", y2: "30", stroke: "#b7c6ea", "stroke-width": "1" }));
    svg.appendChild(makeSvgEl("line", { x1: "23", y1: "6", x2: "23", y2: "30", stroke: "#b7c6ea", "stroke-width": "1" }));
    svg.appendChild(makeSvgEl("line", { x1: "6", y1: "13", x2: "30", y2: "13", stroke: "#b7c6ea", "stroke-width": "1" }));
    svg.appendChild(makeSvgEl("line", { x1: "6", y1: "23", x2: "30", y2: "23", stroke: "#b7c6ea", "stroke-width": "1" }));

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

function createMoveEl(move) {
    const moveEl = document.createElement("span");
    moveEl.className = "move";
    moveEl.appendChild(createMoveSvg(move));

    const label = document.createElement("span");
    label.className = "move-text";
    label.textContent = move;
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
