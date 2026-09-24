export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* circular civic frame */}
      <circle cx="32" cy="32" r="30" fill="#F0F9FF" stroke="#0077B6" strokeWidth="3" />
      {/* water / waves */}
      <path
        d="M14 42c4-4 8-4 12 0s8 4 12 0 8-4 12 0"
        stroke="#0090C1"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M18 50c3.5-3 7-3 10 0s7 3 10 0 6-2.5 9-1"
        stroke="#0077B6"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />
      {/* broom */}
      <path d="M37 12L28.5 29" stroke="#023E8A" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M23.5 31.5l9-4.5 8.5 5-4 9.5c-6 3-11.5 2-15-3.5z"
        fill="#F4A261"
        stroke="#023E8A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* leaf */}
      <path d="M39 21c5.5-8 13-8.5 13-8.5s-.5 8-6 13c-3.8 3.4-7.5 2.6-7.5 2.6s-1.5-4 .5-7z" fill="#2E9D59" />
    </svg>
  );
}
