import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Access NUST — A campus for everyone', description: 'Explore a more inclusive NUST H-12. An independent accessibility map prototype.' };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
