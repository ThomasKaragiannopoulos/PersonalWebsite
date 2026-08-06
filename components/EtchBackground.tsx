type EtchBackgroundProps = {
  image: string;
  flip?: boolean;
};

export function EtchBackground({ image, flip }: EtchBackgroundProps) {
  return (
    <div
      className="etch-wrap"
      style={{
        "--etch-image": `url(${image})`,
        transform: flip ? "scaleX(-1)" : undefined,
      } as React.CSSProperties}
    >
      <div className="etch-layer" />
      <div className="etch-layer etch-layer-b" />
    </div>
  );
}
