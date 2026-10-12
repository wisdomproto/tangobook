/** A local, finite reveal behind the new syllable; no overlay engine or extra image download. */
export function BlendMeetEffect() {
  return (
    <span className="phonics-blend-meet" aria-hidden="true">
      <span className="phonics-blend-meet-halo" />
      <svg className="phonics-blend-meet-petals" viewBox="0 0 400 340" fill="none">
        <g
          className="phonics-blend-meet-coral"
          stroke="#eea77e"
          strokeWidth="7"
          strokeLinecap="round"
        >
          <path d="M43 117 Q12 101 30 81 Q49 82 43 117Z" fill="#ffdcc3" />
          <path d="M96 46 Q65 27 83 13 Q104 17 96 46Z" fill="#ffdcc3" />
          <path d="M357 224 Q388 236 374 255 Q353 254 357 224Z" fill="#ffdcc3" />
        </g>
        <g
          className="phonics-blend-meet-mint"
          stroke="#85bfa0"
          strokeWidth="7"
          strokeLinecap="round"
        >
          <path d="M309 44 Q300 16 320 15 Q340 32 309 44Z" fill="#c6ebd3" />
          <path d="M365 100 Q351 73 374 69 Q393 87 365 100Z" fill="#c6ebd3" />
          <path d="M45 236 Q17 242 23 261 Q45 272 45 236Z" fill="#c6ebd3" />
        </g>
        <g
          className="phonics-blend-meet-sparkles"
          stroke="#d5ae5c"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path d="M200 8 V28 M190 18 H210 M72 174 V194 M62 184 H82 M334 278 V298 M324 288 H344" />
        </g>
        <g className="phonics-blend-meet-bubbles">
          <circle cx="144" cy="22" r="7" fill="#f3bea0" />
          <circle cx="263" cy="26" r="5" fill="#9acead" />
          <circle cx="18" cy="159" r="6" fill="#9acead" />
          <circle cx="381" cy="174" r="7" fill="#f3bea0" />
          <circle cx="112" cy="291" r="5" fill="#eac775" />
          <circle cx="282" cy="306" r="7" fill="#9acead" />
        </g>
      </svg>
    </span>
  );
}
