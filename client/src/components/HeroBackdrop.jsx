function PropertyPin({ x, y, delay = "0s" }) {
  return (
    <g className="hero-property-pin" style={{ animationDelay: delay }}>
      <circle className="hero-property-pin__pulse" cx={x} cy={y} r="36" />
      <path
        d={`M ${x} ${y + 27} C ${x - 4} ${y + 20}, ${x - 21} ${y + 2}, ${x - 21} ${
          y - 11
        } A 21 21 0 1 1 ${x + 21} ${y - 11} C ${x + 21} ${y + 2}, ${x + 4} ${
          y + 20
        }, ${x} ${y + 27} Z`}
        fill="#dc1c24"
      />
      <path
        d={`M ${x - 10} ${y - 12} L ${x} ${y - 20} L ${x + 10} ${y - 12} V ${
          y + 2
        } H ${x + 3} V ${y - 5} H ${x - 3} V ${y + 2} H ${x - 10} Z`}
        fill="white"
      />
    </g>
  );
}

export default function HeroBackdrop({ image = "/assets/hero-real-estate.jpg" }) {
  return (
    <div className="hero-backdrop" aria-hidden="true">
      <img src={image} alt="" fetchPriority="high" className="hero-backdrop__image" />
      <div className="hero-backdrop__aurora" />
      <div className="hero-backdrop__grid" />

      <svg
        className="hero-backdrop__scene"
        viewBox="0 0 1600 700"
        preserveAspectRatio="xMidYMid slice"
      >
        <g className="hero-cloud hero-cloud--one">
          <path
            d="M-70 170 C-25 132, 24 138, 47 170 C69 125, 143 126, 165 170 C210 170, 233 190, 243 214 H-70 Z"
            fill="white"
            opacity=".045"
          />
        </g>
        <g className="hero-cloud hero-cloud--two">
          <path
            d="M1180 115 C1220 76, 1270 91, 1288 120 C1320 65, 1402 72, 1420 128 C1460 119, 1500 142, 1511 173 H1180 Z"
            fill="white"
            opacity=".04"
          />
        </g>

        <PropertyPin x={280} y={350} />
        <PropertyPin x={1390} y={238} delay="-1.7s" />
      </svg>

      <div className="hero-backdrop__light-sweep" />
      <div className="hero-backdrop__shade" />
    </div>
  );
}
