export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" fill="#E12E2E" />
      <g clipPath="url(#clip0_logo)">
        <path
          d="M11 11C10.6044 11 10.2178 11.1173 9.88886 11.3371C9.55996 11.5568 9.30362 11.8692 9.15224 12.2346C9.00087 12.6001 8.96126 13.0022 9.03843 13.3902C9.1156 13.7781 9.30608 14.1345 9.58579 14.4142C9.86549 14.6939 10.2219 14.8844 10.6098 14.9616C10.9978 15.0387 11.3999 14.9991 11.7654 14.8478C12.1308 14.6964 12.4432 14.44 12.6629 14.1111C12.8827 13.7822 13 13.3956 13 13"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M26 21V18H22M18 18H6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 12V21"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 16V18H18M22 18H26V16C26 15.2044 25.6839 14.4413 25.1213 13.8787C24.5587 13.3161 23.7956 13 23 13H17"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 7L25 25"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_logo">
          <rect width="24" height="24" fill="white" transform="translate(4 4)" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function LogoLight({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" fill="white" />
      <g clipPath="url(#clip0_logo_light)">
        <path
          d="M11 11C10.6044 11 10.2178 11.1173 9.88886 11.3371C9.55996 11.5568 9.30362 11.8692 9.15224 12.2346C9.00087 12.6001 8.96126 13.0022 9.03843 13.3902C9.1156 13.7781 9.30608 14.1345 9.58579 14.4142C9.86549 14.6939 10.2219 14.8844 10.6098 14.9616C10.9978 15.0387 11.3999 14.9991 11.7654 14.8478C12.1308 14.6964 12.4432 14.44 12.6629 14.1111C12.8827 13.7822 13 13.3956 13 13"
          stroke="#E12E2E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M26 21V18H22M18 18H6"
          stroke="#E12E2E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 12V21"
          stroke="#E12E2E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 16V18H18M22 18H26V16C26 15.2044 25.6839 14.4413 25.1213 13.8787C24.5587 13.3161 23.7956 13 23 13H17"
          stroke="#E12E2E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 7L25 25"
          stroke="#E12E2E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_logo_light">
          <rect width="24" height="24" fill="white" transform="translate(4 4)" />
        </clipPath>
      </defs>
    </svg>
  );
}
