export type FlowVariant = "zigzag" | "vertical" | "diagonal";

type FlowDiagramProps = {
  steps: string[];
  variant?: FlowVariant;
  reverse?: boolean;
};

const NODE_W = 200;
const NODE_H = 104;
const PAD = 40;

function wrapLines(text: string, maxChars = 22, maxLines = 3): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === maxLines - 1) break;
  }
  if (current) lines.push(current);

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, maxChars - 1)}…`;
  }

  return lines;
}

function layoutZigzag(count: number, reverse: boolean) {
  const spacingX = 240;
  const rowTop = 70;
  const rowBottom = 260;
  const width = PAD * 2 + NODE_W + (count - 1) * spacingX;
  const height = 400;
  const nodes = Array.from({ length: count }, (_, i) => {
    const row = reverse ? (i + 1) % 2 : i % 2;
    return { x: PAD + i * spacingX, y: row === 0 ? rowTop : rowBottom };
  });
  return { width, height, nodes };
}

function layoutVertical(count: number, reverse: boolean) {
  const gapY = 50;
  const width = 400;
  const height = PAD * 2 + count * NODE_H + (count - 1) * gapY;
  const offsetX = width - NODE_W - PAD * 2;
  const nodes = Array.from({ length: count }, (_, i) => {
    const left = reverse ? i % 2 === 1 : i % 2 === 0;
    return { x: PAD + (left ? 0 : offsetX), y: PAD + i * (NODE_H + gapY) };
  });
  return { width, height, nodes };
}

function layoutDiagonal(count: number, reverse: boolean) {
  const spacingX = 220;
  const stepY = 56;
  const width = PAD * 2 + NODE_W + (count - 1) * spacingX;
  const height = PAD * 2 + NODE_H + (count - 1) * stepY;
  const nodes = Array.from({ length: count }, (_, i) => {
    const idx = reverse ? count - 1 - i : i;
    return { x: PAD + i * spacingX, y: PAD + idx * stepY };
  });
  return { width, height, nodes };
}

export function FlowDiagram({ steps, variant = "zigzag", reverse = false }: FlowDiagramProps) {
  const layout =
    variant === "vertical"
      ? layoutVertical(steps.length, reverse)
      : variant === "diagonal"
        ? layoutDiagonal(steps.length, reverse)
        : layoutZigzag(steps.length, reverse);

  const nodes = layout.nodes.map(({ x, y }, i) => ({ step: steps[i], x, y, cy: y + NODE_H / 2 }));
  const isVertical = variant === "vertical";

  return (
    <div className="w-full overflow-x-auto rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        width={layout.width}
        height={layout.height}
        className={isVertical ? "mx-auto block h-[520px] w-auto sm:h-[600px]" : "block h-[280px] w-auto sm:h-[340px]"}
      >
        <defs>
          <pattern id="flow-grid" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--muted)" opacity="0.35" />
          </pattern>
          <marker
            id="flow-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
          </marker>
        </defs>

        <rect x="0" y="0" width={layout.width} height={layout.height} fill="url(#flow-grid)" />

        {nodes.slice(0, -1).map((node, i) => {
          const next = nodes[i + 1];
          const d = isVertical
            ? (() => {
                const startY = node.y + NODE_H;
                const startX = node.x + NODE_W / 2;
                const endY = next.y;
                const endX = next.x + NODE_W / 2;
                const midY = (startY + endY) / 2;
                return `M ${startX} ${startY} C ${startX} ${midY} ${endX} ${midY} ${endX} ${endY}`;
              })()
            : (() => {
                const startX = node.x + NODE_W;
                const endX = next.x;
                const midX = (startX + endX) / 2;
                return `M ${startX} ${node.cy} C ${midX} ${node.cy} ${midX} ${next.cy} ${endX} ${next.cy}`;
              })();
          return (
            <path
              key={`edge-${i}`}
              d={d}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="1.75"
              strokeDasharray="4 5"
              markerEnd="url(#flow-arrow)"
            />
          );
        })}

        {nodes.map((node, i) => (
          <g key={node.step}>
            <rect
              x={node.x}
              y={node.y}
              width={NODE_W}
              height={NODE_H}
              rx="12"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.25"
            />
            <circle cx={node.x + 20} cy={node.y + 20} r="13" fill="none" stroke="var(--foreground)" strokeWidth="1.25" />
            <text
              x={node.x + 20}
              y={node.y + 21}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-noir"
              fontSize="13"
              fill="var(--foreground)"
            >
              {i + 1}
            </text>
            {wrapLines(node.step).map((line, li, arr) => (
              <text
                key={li}
                x={node.x + 16}
                y={node.y + 50 + li * 16 - ((arr.length - 1) * 16) / 2}
                className="font-typewriter"
                fontSize="13"
                fill="var(--foreground)"
                opacity="0.9"
              >
                {line}
              </text>
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
