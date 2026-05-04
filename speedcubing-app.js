(() => {
    const { makeSvgEl, createMoveEl, colorFromCode } = window.speedcubingUtils;
    const SCRAMBLE_SPECS = [
        {
            key: "2x2",
            label: "2x2",
            moveCount: 9,
            moves: ["U", "D", "R", "L", "F", "B"],
            suffixes: ["", "'", "2"]
        },
        {
            key: "3x3",
            label: "3x3",
            moveCount: 20,
            moves: ["U", "D", "R", "L", "F", "B"],
            suffixes: ["", "'", "2"]
        },
        {
            key: "4x4",
            label: "4x4",
            moveCount: 40,
            moves: ["U", "D", "R", "L", "F", "B", "Uw", "Dw", "Rw", "Lw", "Fw", "Bw"],
            suffixes: ["", "'", "2"]
        }
    ];
    const AXIS_BY_FACE = {
        U: "UD",
        D: "UD",
        R: "RL",
        L: "RL",
        F: "FB",
        B: "FB"
    };
    const HIDDEN_CASES_KEY_PREFIX = "speedcubing:hiddenCases:";

    function randomItem(items) {
        return items[Math.floor(Math.random() * items.length)];
    }

    function getMoveFace(move) {
        return (String(move).match(/[URFDLB]/i) || ["U"])[0].toUpperCase();
    }

    function getMoveAxis(move) {
        return AXIS_BY_FACE[getMoveFace(move)] || "UD";
    }

    function generateScramble(specKey) {
        const spec = SCRAMBLE_SPECS.find((entry) => entry.key === specKey);
        if (!spec) {
            return "";
        }

        const moves = [];
        while (moves.length < spec.moveCount) {
            const baseMove = randomItem(spec.moves);
            const move = `${baseMove}${randomItem(spec.suffixes)}`;
            const previousMove = moves[moves.length - 1];
            const earlierMove = moves[moves.length - 2];

            if (previousMove && getMoveFace(previousMove) === getMoveFace(move)) {
                continue;
            }

            if (
                previousMove &&
                earlierMove &&
                getMoveAxis(previousMove) === getMoveAxis(move) &&
                getMoveAxis(earlierMove) === getMoveAxis(move)
            ) {
                continue;
            }

            moves.push(move);
        }

        return moves.join(" ");
    }

    function renderMoveSequence(targetEl, sequence, cubeSize = 3) {
        targetEl.innerHTML = "";
        tokenizeSequence(sequence).forEach((token) => {
            targetEl.appendChild(createTokenNode(token, cubeSize));
        });
    }

    function createRefreshIcon() {
        const svg = makeSvgEl("svg", {
            class: "scramble-action-icon",
            viewBox: "0 0 24 24",
            "aria-hidden": "true",
            focusable: "false"
        });

        svg.appendChild(makeSvgEl("path", {
            d: "M19 7v4h-4",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
        }));
        svg.appendChild(makeSvgEl("path", {
            d: "M18 11a7 7 0 1 0 1.5 6.5",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
        }));

        return svg;
    }

    function createCubeIcon(cubeKey) {
        const cubeSize = Math.max(2, Math.min(6, Number(String(cubeKey || "").match(/\d+/)?.[0] || 3)));
        const faceSize = 15;
        const faceX = 4.5;
        const faceY = 4.5;
        const cell = faceSize / cubeSize;

        const svg = makeSvgEl("svg", {
            class: "scramble-cube-icon",
            viewBox: "0 0 24 24",
            "aria-hidden": "true",
            focusable: "false"
        });

        svg.appendChild(makeSvgEl("polygon", {
            points: "4.5,4.5 19.5,4.5 17.5,2.5 6.5,2.5",
            fill: "#ffe78a",
            stroke: "#35549d",
            "stroke-width": "0.8"
        }));

        svg.appendChild(makeSvgEl("polygon", {
            points: "19.5,4.5 19.5,19.5 17.5,17.5 17.5,2.5",
            fill: "#e8eefc",
            stroke: "#35549d",
            "stroke-width": "0.8"
        }));

        svg.appendChild(makeSvgEl("rect", {
            x: String(faceX),
            y: String(faceY),
            width: String(faceSize),
            height: String(faceSize),
            fill: "#31b45b",
            stroke: "#35549d",
            "stroke-width": "0.95"
        }));

        for (let i = 1; i < cubeSize; i += 1) {
            const offset = faceX + i * cell;
            svg.appendChild(makeSvgEl("line", {
                x1: String(offset),
                y1: String(faceY),
                x2: String(offset),
                y2: String(faceY + faceSize),
                stroke: "#35549d",
                "stroke-width": "0.75"
            }));

            svg.appendChild(makeSvgEl("line", {
                x1: String(faceX),
                y1: String(offset),
                x2: String(faceX + faceSize),
                y2: String(offset),
                stroke: "#35549d",
                "stroke-width": "0.75"
            }));
        }

        return svg;
    }

    function normalizeCubeKey(cubeKey) {
        return String(cubeKey || "").match(/\d+x\d+/)?.[0] || "";
    }

    function cubeSizeFromKey(cubeKey, fallback = 3) {
        return Math.max(2, Math.min(6, Number(String(cubeKey || "").match(/\d+/)?.[0] || fallback)));
    }

    function getHiddenCasesStorageKey(cubeKey) {
        return `${HIDDEN_CASES_KEY_PREFIX}${normalizeCubeKey(cubeKey) || String(cubeKey || "unknown")}`;
    }

    function createCaseId(cubeKey, groupName, caseItem) {
        const safeGroupName = String(groupName || "").trim();
        const safeCaseName = String(caseItem?.name || "").trim();
        const safeSequence = String(caseItem?.sequence || "").trim();
        return `${normalizeCubeKey(cubeKey)}::${safeGroupName}::${safeCaseName}::${safeSequence}`;
    }

    function createMarkdownGroupId(cubeKey, groupName, markdown) {
        const safeGroupName = String(groupName || "").trim();
        const safeMarkdown = String(markdown || "").trim();
        return `${normalizeCubeKey(cubeKey)}::markdown::${safeGroupName}::${safeMarkdown}`;
    }

    function loadHiddenCaseIds(cubeKey) {
        try {
            const raw = window.localStorage.getItem(getHiddenCasesStorageKey(cubeKey));
            const parsed = JSON.parse(raw || "[]");
            if (!Array.isArray(parsed)) {
                return new Set();
            }
            return new Set(parsed.filter((item) => typeof item === "string" && item.length > 0));
        } catch {
            return new Set();
        }
    }

    function saveHiddenCaseIds(cubeKey, hiddenCaseIds) {
        try {
            window.localStorage.setItem(
                getHiddenCasesStorageKey(cubeKey),
                JSON.stringify(Array.from(hiddenCaseIds))
            );
        } catch {
            // Ignore storage failures (private mode/quota) and keep UI usable.
        }
    }

    function createScrambleCard(spec, activeCubeKey) {
        const cubeSize = cubeSizeFromKey(spec.key, 3);
        const card = document.createElement("section");
        card.className = "scramble-card";
        if (normalizeCubeKey(activeCubeKey) === spec.key) {
            card.classList.add("active");
        }

        const top = document.createElement("div");
        top.className = "scramble-card-top";

        const label = document.createElement("div");
        label.className = "scramble-label";
        label.appendChild(createCubeIcon(spec.key));

        const labelText = document.createElement("span");
        labelText.textContent = `${spec.label} scramble`;
        label.appendChild(labelText);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "scramble-refresh";
        button.setAttribute("aria-label", `Generate a new ${spec.label} scramble`);
        button.appendChild(createRefreshIcon());

        top.appendChild(label);
        top.appendChild(button);

        const meta = document.createElement("div");
        meta.className = "scramble-meta";
        meta.textContent = `${spec.moveCount} moves`;

        const sequence = document.createElement("div");
        sequence.className = "sequence scramble-sequence";

        const applyScramble = () => {
            renderMoveSequence(sequence, generateScramble(spec.key), cubeSize);
        };

        button.addEventListener("click", applyScramble);
        applyScramble();

        card.appendChild(top);
        card.appendChild(meta);
        card.appendChild(sequence);
        return card;
    }

    function renderHeaderScrambles(targetEl, activeCubeKey, onlyActiveCube = false) {
        if (!targetEl) {
            return;
        }

        const normalizedActiveCube = normalizeCubeKey(activeCubeKey);
        const specsToRender = onlyActiveCube && normalizedActiveCube
            ? SCRAMBLE_SPECS.filter((spec) => spec.key === normalizedActiveCube)
            : SCRAMBLE_SPECS;

        targetEl.innerHTML = "";
        specsToRender.forEach((spec) => {
            targetEl.appendChild(createScrambleCard(spec, activeCubeKey));
        });
    }

    function normalizeFaceGrid(faceData, size, fallbackCode) {
        const fallbackRows = Array.from({ length: size }, () =>
            Array.from({ length: size }, () => fallbackCode)
        );

        if (!Array.isArray(faceData) || !faceData.length) {
            return fallbackRows;
        }

        if (typeof faceData[0] === "string" && faceData[0].includes("|")) {
            const rows = faceData
                .slice(0, size)
                .map((row) => String(row).split("|").slice(0, size));

            while (rows.length < size) {
                rows.push(Array.from({ length: size }, () => fallbackCode));
            }

            return rows.map((row) => {
                const fixed = row.map((cell) => String(cell || fallbackCode).trim() || fallbackCode);
                while (fixed.length < size) {
                    fixed.push(fallbackCode);
                }
                return fixed;
            });
        }

        const legacyFlat = faceData.map((value) => String(value || fallbackCode));
        if (legacyFlat.length >= size * size) {
            const rows = [];
            for (let row = 0; row < size; row += 1) {
                rows.push(legacyFlat.slice(row * size, row * size + size));
            }
            return rows;
        }

        return fallbackRows;
    }

    function drawFace(svg, stickers, size, x, y, cell) {
        for (let row = 0; row < size; row += 1) {
            for (let col = 0; col < size; col += 1) {
                const idx = row * size + col;
                const fill = colorFromCode(stickers[idx]);
                svg.appendChild(makeSvgEl("rect", {
                    x: String(x + col * cell),
                    y: String(y + row * cell),
                    width: String(cell - 1),
                    height: String(cell - 1),
                    rx: "1.2",
                    fill,
                    stroke: "#7e8fbf",
                    "stroke-width": "0.8"
                }));
            }
        }
    }

    function drawHorizontalBand(svg, colors, x, yInner, yOuter, innerWidth, outerWidth) {
        const count = colors.length;
        const innerStep = innerWidth / count;
        const outerStep = outerWidth / count;
        const outerX = x - (outerWidth - innerWidth) / 2;

        for (let i = 0; i < count; i += 1) {
            const ix1 = x + i * innerStep;
            const ix2 = x + (i + 1) * innerStep;
            const ox1 = outerX + i * outerStep;
            const ox2 = outerX + (i + 1) * outerStep;

            svg.appendChild(makeSvgEl("polygon", {
                points: `${ix1},${yInner} ${ix2},${yInner} ${ox2},${yOuter} ${ox1},${yOuter}`,
                fill: colorFromCode(colors[i]),
                stroke: "#7e8fbf",
                "stroke-width": "0.8"
            }));
        }
    }

    function drawVerticalBand(svg, colors, xInner, xOuter, y, innerHeight, outerHeight) {
        const count = colors.length;
        const innerStep = innerHeight / count;
        const outerStep = outerHeight / count;
        const outerY = y - (outerHeight - innerHeight) / 2;

        for (let i = 0; i < count; i += 1) {
            const iy1 = y + i * innerStep;
            const iy2 = y + (i + 1) * innerStep;
            const oy1 = outerY + i * outerStep;
            const oy2 = outerY + (i + 1) * outerStep;

            svg.appendChild(makeSvgEl("polygon", {
                points: `${xInner},${iy1} ${xInner},${iy2} ${xOuter},${oy2} ${xOuter},${oy1}`,
                fill: colorFromCode(colors[i]),
                stroke: "#7e8fbf",
                "stroke-width": "0.8"
            }));
        }
    }

    function createStartImageSvg(startImage, cubeSize) {
        if (startImage && startImage.type === "image" && startImage.url) {
            const img = document.createElement("img");
            img.src = startImage.url;
            img.alt = "Cube case image";
            img.className = "start-preview";
            return img;
        }

        const size = Number(startImage && startImage.size) || cubeSize;
        const faces = (startImage && startImage.faces) || {};
        const upGrid = normalizeFaceGrid(faces.U, size, "y");
        const frontGrid = normalizeFaceGrid(faces.F, size, "g");
        const rightGrid = normalizeFaceGrid(faces.R, size, "r");
        const backGrid = normalizeFaceGrid(faces.B, size, "b");
        const leftGrid = normalizeFaceGrid(faces.L, size, "o");

        const up = upGrid.flat();
        const frontRow = frontGrid[0];
        const rightRow = rightGrid[0];
        const backRow = backGrid[0];
        const leftRow = leftGrid[0];

        const faceWidth = size === 2 ? 34 : size === 3 ? 38 : 40;
        const bandDepth = size === 2 ? 10 : size === 3 ? 9 : 8;
        const expand = size === 2 ? 8 : size === 3 ? 6 : 5;
        const cell = faceWidth / size;
        const topX = 60 - faceWidth / 2;
        const topY = 26;

        const svg = makeSvgEl("svg", {
            class: "start-preview",
            viewBox: "0 0 120 96",
            "aria-hidden": "true",
            focusable: "false"
        });

        drawHorizontalBand(svg, backRow, topX, topY, topY - bandDepth, faceWidth, faceWidth + expand * 2);
        drawVerticalBand(svg, rightRow, topX + faceWidth, topX + faceWidth + bandDepth, topY, faceWidth, faceWidth + expand * 2);
        drawHorizontalBand(svg, frontRow, topX, topY + faceWidth, topY + faceWidth + bandDepth, faceWidth, faceWidth + expand * 2);
        drawVerticalBand(svg, leftRow, topX, topX - bandDepth, topY, faceWidth, faceWidth + expand * 2);

        drawFace(svg, up, size, topX, topY, cell);

        svg.appendChild(makeSvgEl("rect", {
            x: String(topX),
            y: String(topY),
            width: String(faceWidth),
            height: String(faceWidth),
            fill: "none",
            stroke: "#6f83b6",
            "stroke-width": "1.1"
        }));

        return svg;
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function inlineMarkdownToHtml(value) {
        let html = escapeHtml(value);
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
        html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
        html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");
        return html;
    }

    function markdownToHtml(markdownText) {
        const lines = String(markdownText || "").split(/\r?\n/);
        const parts = [];
        let paragraphLines = [];
        let listType = null;

        const flushParagraph = () => {
            if (!paragraphLines.length) {
                return;
            }
            parts.push(`<p>${paragraphLines.map((line) => inlineMarkdownToHtml(line)).join("<br>")}</p>`);
            paragraphLines = [];
        };

        const closeList = () => {
            if (!listType) {
                return;
            }
            parts.push(`</${listType}>`);
            listType = null;
        };

        lines.forEach((line) => {
            const trimmed = line.trim();

            if (!trimmed) {
                flushParagraph();
                closeList();
                return;
            }

            const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
            if (headingMatch) {
                flushParagraph();
                closeList();
                const level = headingMatch[1].length;
                parts.push(`<h${level}>${inlineMarkdownToHtml(headingMatch[2])}</h${level}>`);
                return;
            }

            const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
            if (unorderedMatch) {
                flushParagraph();
                if (listType !== "ul") {
                    closeList();
                    listType = "ul";
                    parts.push("<ul>");
                }
                parts.push(`<li>${inlineMarkdownToHtml(unorderedMatch[1])}</li>`);
                return;
            }

            const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
            if (orderedMatch) {
                flushParagraph();
                if (listType !== "ol") {
                    closeList();
                    listType = "ol";
                    parts.push("<ol>");
                }
                parts.push(`<li>${inlineMarkdownToHtml(orderedMatch[1])}</li>`);
                return;
            }

            const quoteMatch = trimmed.match(/^>\s?(.+)$/);
            if (quoteMatch) {
                flushParagraph();
                closeList();
                parts.push(`<blockquote>${inlineMarkdownToHtml(quoteMatch[1])}</blockquote>`);
                return;
            }

            paragraphLines.push(trimmed);
        });

        flushParagraph();
        closeList();
        return parts.join("\n");
    }

    function tokenizeSequence(sequence) {
        return String(sequence || "")
            .match(/\(|\)|[^\s()]+/g) || [];
    }

    function createTokenNode(token, cubeSize = 3) {
        if (token === "(" || token === ")") {
            const span = document.createElement("span");
            span.className = "move-text";
            span.textContent = token;
            return span;
        }

        return createMoveEl(token, cubeSize);
    }

    function renderSheet(config, cubeKey, sheetEl, statusEl, options = {}) {
        sheetEl.innerHTML = "";
        const groups = Array.isArray(config.groups) ? config.groups : [];
        const cubeSize = cubeSizeFromKey(cubeKey, 2);
        const hiddenCaseIds = loadHiddenCaseIds(cubeKey);
        const showHiddenKnownCases = Boolean(options.showHiddenKnownCases);

        if (!groups.length) {
            const empty = document.createElement("div");
            empty.className = "hint";
            empty.textContent = `No ${cubeKey} cases yet. Add groups and cases to the matching JSON config.`;
            sheetEl.appendChild(empty);
            statusEl.textContent = `No cases loaded for ${cubeKey}.`;
            return;
        }

        let caseCount = 0;
        let visibleCaseCount = 0;
        let itemCount = 0;
        let visibleItemCount = 0;

        const controls = document.createElement("div");
        controls.className = "sheet-controls";

        const visibilitySummary = document.createElement("span");
        visibilitySummary.className = "sheet-visibility-summary";

        const showHiddenBtn = document.createElement("button");
        showHiddenBtn.type = "button";
        showHiddenBtn.className = "secondary sheet-control-btn";

        const resetHiddenBtn = document.createElement("button");
        resetHiddenBtn.type = "button";
        resetHiddenBtn.className = "secondary sheet-control-btn";
        resetHiddenBtn.textContent = "Reset known";

        groups.forEach((group) => {
            const cases = Array.isArray(group.cases) ? group.cases : [];
            const markdown = typeof group.markdown === "string" ? group.markdown.trim() : "";
            const hasMarkdown = markdown.length > 0;

            if (!cases.length && !hasMarkdown) {
                return;
            }

            const block = document.createElement("section");
            block.className = "group-block";

            const title = document.createElement("h3");
            title.className = "group-title";
            title.textContent = group.name || "General";
            block.appendChild(title);

            if (hasMarkdown) {
                itemCount += 1;
                const markdownId = createMarkdownGroupId(cubeKey, group.name, markdown);
                const isHiddenKnownMarkdown = hiddenCaseIds.has(markdownId);

                if (!isHiddenKnownMarkdown || showHiddenKnownCases) {
                    const markdownEl = document.createElement("div");
                    markdownEl.className = "group-markdown";
                    if (isHiddenKnownMarkdown) {
                        markdownEl.classList.add("is-hidden-known");
                    }

                    const markdownActions = document.createElement("div");
                    markdownActions.className = "group-markdown-actions";

                    const markdownHideBtn = document.createElement("button");
                    markdownHideBtn.type = "button";
                    markdownHideBtn.className = "secondary case-hide-toggle";
                    markdownHideBtn.textContent = isHiddenKnownMarkdown ? "Unhide" : "Known";
                    markdownHideBtn.setAttribute(
                        "aria-label",
                        isHiddenKnownMarkdown
                            ? `Show ${group.name || "markdown notes"} again`
                            : `Hide ${group.name || "markdown notes"} as known`
                    );
                    markdownHideBtn.addEventListener("click", () => {
                        if (hiddenCaseIds.has(markdownId)) {
                            hiddenCaseIds.delete(markdownId);
                        } else {
                            hiddenCaseIds.add(markdownId);
                        }
                        saveHiddenCaseIds(cubeKey, hiddenCaseIds);
                        renderSheet(config, cubeKey, sheetEl, statusEl, { showHiddenKnownCases });
                    });

                    const markdownContent = document.createElement("div");
                    markdownContent.className = "group-markdown-content";
                    markdownContent.innerHTML = markdownToHtml(markdown);

                    markdownActions.appendChild(markdownHideBtn);
                    markdownEl.appendChild(markdownActions);
                    markdownEl.appendChild(markdownContent);
                    block.appendChild(markdownEl);
                    visibleItemCount += 1;
                }
            }

            cases.forEach((caseItem, index) => {
                caseCount += 1;
                itemCount += 1;
                const caseId = createCaseId(cubeKey, group.name, caseItem);
                const isHiddenKnownCase = hiddenCaseIds.has(caseId);
                if (isHiddenKnownCase && !showHiddenKnownCases) {
                    return;
                }

                const card = document.createElement("article");
                card.className = "alg-card";
                card.style.animationDelay = `${index * 45}ms`;
                if (isHiddenKnownCase) {
                    card.classList.add("is-hidden-known");
                }

                const caseTop = document.createElement("div");
                caseTop.className = "case-top";

                const head = document.createElement("div");
                head.className = "alg-head";

                const headActions = document.createElement("div");
                headActions.className = "alg-head-actions";

                const hideBtn = document.createElement("button");
                hideBtn.type = "button";
                hideBtn.className = "secondary case-hide-toggle";
                hideBtn.textContent = isHiddenKnownCase ? "Unhide" : "Known";
                hideBtn.setAttribute(
                    "aria-label",
                    isHiddenKnownCase
                        ? `Show ${caseItem.name || "case"} again`
                        : `Hide ${caseItem.name || "case"} as known`
                );
                hideBtn.addEventListener("click", () => {
                    if (hiddenCaseIds.has(caseId)) {
                        hiddenCaseIds.delete(caseId);
                    } else {
                        hiddenCaseIds.add(caseId);
                    }
                    saveHiddenCaseIds(cubeKey, hiddenCaseIds);
                    renderSheet(config, cubeKey, sheetEl, statusEl, { showHiddenKnownCases });
                });
                headActions.appendChild(hideBtn);

                const name = document.createElement("div");
                name.className = "alg-name";
                name.textContent = caseItem.name || "Case";

                const tokens = tokenizeSequence(caseItem.sequence);
                const moveCount = tokens.filter((token) => token !== "(" && token !== ")").length;

                const meta = document.createElement("div");
                meta.className = "alg-meta";
                meta.textContent = `${moveCount} moves`;

                head.appendChild(name);
                head.appendChild(meta);
                head.appendChild(headActions);
                const details = document.createElement("div");
                details.className = "case-details";
                details.appendChild(head);

                const cubeGuide = document.createElement("div");
                cubeGuide.className = "cube-guide";

                const cubeGuideLabel = document.createElement("span");
                cubeGuideLabel.className = "cube-guide-label";

                const preview = createStartImageSvg(caseItem.startImage, cubeSize);
                cubeGuide.appendChild(cubeGuideLabel);
                cubeGuide.appendChild(preview);

                const sequenceLabel = document.createElement("div");
                sequenceLabel.className = "sequence-label";
                details.appendChild(sequenceLabel);

                const seq = document.createElement("div");
                seq.className = "sequence";
                if (tokens.length > 10) {
                    seq.classList.add("is-dense");
                }
                tokens.forEach((token) => {
                    seq.appendChild(createTokenNode(token, cubeSize));
                });
                details.appendChild(seq);

                caseTop.appendChild(details);
                caseTop.appendChild(cubeGuide);
                card.appendChild(caseTop);
                block.appendChild(card);
                visibleCaseCount += 1;
                visibleItemCount += 1;
            });

            if (block.querySelector(".alg-card, .group-markdown")) {
                sheetEl.appendChild(block);
            }
        });

        const hiddenCount = hiddenCaseIds.size;
        const hiddenLabel = hiddenCount === 1 ? "1 known item hidden" : `${hiddenCount} known items hidden`;

        visibilitySummary.textContent = showHiddenKnownCases
            ? `Showing all ${itemCount} items (${hiddenCount} marked known).`
            : `Showing ${visibleItemCount} of ${itemCount} items.`;

        showHiddenBtn.textContent = showHiddenKnownCases ? "Hide known cases" : `Show known (${hiddenCount})`;
        showHiddenBtn.disabled = hiddenCount === 0;
        showHiddenBtn.addEventListener("click", () => {
            renderSheet(config, cubeKey, sheetEl, statusEl, {
                showHiddenKnownCases: !showHiddenKnownCases
            });
        });

        resetHiddenBtn.disabled = hiddenCount === 0;
        resetHiddenBtn.addEventListener("click", () => {
            hiddenCaseIds.clear();
            saveHiddenCaseIds(cubeKey, hiddenCaseIds);
            renderSheet(config, cubeKey, sheetEl, statusEl, {
                showHiddenKnownCases: false
            });
        });

        controls.appendChild(visibilitySummary);
        controls.appendChild(showHiddenBtn);
        controls.appendChild(resetHiddenBtn);
        sheetEl.prepend(controls);

        statusEl.textContent = hiddenCount
            ? `Rendered ${visibleCaseCount} of ${caseCount} cases for ${cubeKey} (${hiddenLabel}).`
            : `Rendered ${visibleCaseCount} cases for ${cubeKey}.`;
    }

    async function renderCubePage(cubeKey, configPath, sheetEl, statusEl) {
        statusEl.setAttribute("role", "status");
        statusEl.setAttribute("aria-live", "polite");

        try {
            const response = await fetch(`${configPath}?t=${Date.now()}`);
            if (!response.ok) {
                throw new Error(`Could not load ${configPath} (${response.status}).`);
            }

            const json = await response.json();
            statusEl.dataset.state = "ok";
            renderSheet(json, cubeKey, sheetEl, statusEl);
        } catch (err) {
            statusEl.textContent = `${err.message || "Failed to read config."} If opened via file://, use a local server.`;
            statusEl.dataset.state = "error";
            sheetEl.innerHTML = "";
        }
    }

    window.speedcubingApp = {
        generateScramble,
        renderHeaderScrambles,
        renderCubePage
    };
})();
