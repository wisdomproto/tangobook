import './phonics-backdrop.css';

/** 정적인 SVG 풍경. 입력·음원·학습 판정을 갖지 않고 글자 주변의 빈 공간만 채운다. */
export function PhonicsBackdrop() {
  return (
    <div className="phonics-backdrop" aria-hidden="true">
      <div className="phonics-backdrop-sun" />
      <svg className="phonics-backdrop-cloud phonics-backdrop-cloud--left" viewBox="0 0 220 100">
        <path
          d="M35 84C6 84 3 44 33 39C36 6 86 1 101 29C126 6 174 20 174 50C215 46 220 84 190 84Z"
          fill="white"
        />
      </svg>
      <svg className="phonics-backdrop-cloud phonics-backdrop-cloud--right" viewBox="0 0 220 100">
        <path
          d="M35 84C6 84 3 44 33 39C36 6 86 1 101 29C126 6 174 20 174 50C215 46 220 84 190 84Z"
          fill="white"
        />
      </svg>
      <svg
        className="phonics-backdrop-ground"
        viewBox="0 0 1600 260"
        preserveAspectRatio="xMidYMax slice"
      >
        <path d="M0 132Q200 26 420 146T840 144T1260 138T1600 95V260H0Z" fill="#dff0e4" />
        <path d="M0 209Q280 94 550 205T1060 206T1600 170V260H0Z" fill="#c6e3d2" />
        <g stroke="#89bda0" strokeWidth="6" strokeLinecap="round" fill="#a4cfaf">
          <path d="M125 215V163M125 191Q88 182 94 159Q123 156 125 191M125 179Q153 144 165 162Q163 183 125 179" />
          <path d="M1460 227V169M1460 199Q1431 176 1420 189Q1429 214 1460 199M1460 184Q1479 157 1497 166Q1495 192 1460 184" />
        </g>
        <g fill="#fff5d7">
          <circle cx="215" cy="218" r="10" />
          <circle cx="230" cy="211" r="10" />
          <circle cx="235" cy="227" r="10" />
          <circle cx="218" cy="234" r="10" />
          <circle cx="1335" cy="215" r="9" />
          <circle cx="1349" cy="210" r="9" />
          <circle cx="1353" cy="225" r="9" />
          <circle cx="1337" cy="230" r="9" />
        </g>
        <g fill="#efc577">
          <circle cx="225" cy="223" r="7" />
          <circle cx="1344" cy="220" r="6" />
        </g>
      </svg>
      {['left', 'right'].map((side) => (
        <svg
          key={side}
          className={`phonics-backdrop-flora phonics-backdrop-flora--${side}`}
          viewBox="0 0 110 100"
        >
          <path
            d="M37 92V45M37 70Q7 56 12 35Q37 37 37 70M37 59Q51 27 70 38Q65 59 37 59"
            fill="#a4cfaf"
            stroke="#89bda0"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <g fill="#fff5d7">
            <circle cx="74" cy="73" r="9" />
            <circle cx="89" cy="68" r="9" />
            <circle cx="92" cy="83" r="9" />
            <circle cx="77" cy="88" r="9" />
          </g>
          <circle cx="82" cy="78" r="6" fill="#efc577" />
        </svg>
      ))}
    </div>
  );
}
