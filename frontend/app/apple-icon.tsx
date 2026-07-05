import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0B1527',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 512 150 L 150 850 L 350 850 L 512 537 L 674 850 L 874 850 Z" fill="white"/>
          <path d="M 180 650 Q 350 650 512 500 T 800 250" stroke="white" strokeWidth="100" strokeLinecap="round" fill="none"/>
          <path d="M 600 250 L 800 250 L 800 450" stroke="white" strokeWidth="100" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </div>
    ),
    { ...size }
  )
}
