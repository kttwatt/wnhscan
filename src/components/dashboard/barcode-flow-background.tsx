const BARCODE_VARIANTS: number[][] = [
  [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1],
  [1, 2, 3, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 3],
  [3, 1, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1],
  [1, 1, 2, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1],
];

type FlowRow = {
  top: string;
  duration: number;
  delay: number;
  reverse?: boolean;
  fillOpacity: number;
  scale: number;
  count: number;
};

const FLOW_ROWS: FlowRow[] = [
  { top: "4%", duration: 32, delay: 0, fillOpacity: 0.12, scale: 1, count: 14 },
  { top: "20%", duration: 40, delay: -9, reverse: true, fillOpacity: 0.09, scale: 1.05, count: 12 },
  { top: "38%", duration: 36, delay: -4, fillOpacity: 0.11, scale: 0.95, count: 15 },
  { top: "56%", duration: 44, delay: -16, reverse: true, fillOpacity: 0.08, scale: 1.08, count: 11 },
  { top: "74%", duration: 38, delay: -11, fillOpacity: 0.1, scale: 1, count: 13 },
  { top: "88%", duration: 42, delay: -20, reverse: true, fillOpacity: 0.07, scale: 1.04, count: 10 },
];

function BarcodeGlyph({ variant = 0, fillOpacity }: { variant?: number; fillOpacity: number }) {
  const bars = BARCODE_VARIANTS[variant % BARCODE_VARIANTS.length];
  let x = 4;

  return (
    <svg
      viewBox="0 0 88 22"
      className="h-6 w-24 shrink-0 sm:h-7 sm:w-28"
      aria-hidden
    >
      {bars.map((width, i) => {
        const rect = (
          <rect
            key={i}
            x={x}
            y={2}
            width={width}
            height={18}
            rx={0.5}
            fill={`rgba(255,255,255,${fillOpacity})`}
          />
        );
        x += width + 1.5;
        return rect;
      })}
    </svg>
  );
}

function BarcodeTrack({ row }: { row: FlowRow }) {
  const items = Array.from({ length: row.count * 3 }, (_, i) => i);

  return (
    <div
      className="absolute left-0 origin-left"
      style={{
        top: row.top,
        transform: `scale(${row.scale})`,
      }}
    >
      <div
        className={`barcode-flow-track flex w-max gap-8 sm:gap-10 ${
          row.reverse ? "barcode-flow-track-reverse" : ""
        }`}
        style={{
          animationDuration: `${row.duration}s`,
          animationDelay: `${row.delay}s`,
        }}
      >
        {items.map((i) => (
          <BarcodeGlyph key={i} variant={i % BARCODE_VARIANTS.length} fillOpacity={row.fillOpacity} />
        ))}
      </div>
    </div>
  );
}

export function BarcodeFlowBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-50" aria-hidden>
      <div className="barcode-flow-texture absolute inset-0 opacity-50" />

      {FLOW_ROWS.map((row, i) => (
        <BarcodeTrack key={i} row={row} />
      ))}

      <div className="barcode-scan-beam absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-transparent via-sky-200/15 to-transparent sm:w-36" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/30 via-transparent to-navy-900/40" />
    </div>
  );
}
