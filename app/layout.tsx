import type { Metadata } from 'next'
import './globals.css'

export const metadata = {
  title: "StreamFlix",
  description: "Convert Magnet Links to Instant Streams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
