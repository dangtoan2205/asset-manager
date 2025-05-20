import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from '@/components/session-provider'
import AppNavbar from '@/components/app-navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Quản lý Thiết bị & Tài khoản',
    description: 'Hệ thống quản lý thiết bị và tài khoản cho doanh nghiệp',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={inter.className}>
                <SessionProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <AppNavbar />
                        {children}
                    </ThemeProvider>
                </SessionProvider>
            </body>
        </html>
    )
} 