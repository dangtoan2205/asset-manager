import Link from 'next/link'
import { ModeToggle } from '@/components/mode-toggle'

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Quản lý Thiết bị & Tài khoản</h1>
                    <div className="flex items-center gap-4">
                        <ModeToggle />
                        <Link
                            href="/login"
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                        >
                            Đăng nhập
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto py-8 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DashboardCard
                        title="Thiết bị"
                        description="Quản lý máy tính, máy in, màn hình và các thiết bị CNTT khác"
                        href="/devices"
                        icon="💻"
                    />
                    <DashboardCard
                        title="Linh kiện"
                        description="Quản lý các linh kiện máy tính, tai nghe, USB và thiết bị ngoại vi"
                        href="/components"
                        icon="🔌"
                    />
                    <DashboardCard
                        title="Tài khoản"
                        description="Quản lý tài khoản VPN, email, cloud, GitHub, Jira và các access key"
                        href="/accounts"
                        icon="🔑"
                    />
                    <DashboardCard
                        title="Nhân viên"
                        description="Quản lý thông tin nhân viên và phân bổ tài sản"
                        href="/employees"
                        icon="👥"
                    />
                    <DashboardCard
                        title="Báo cáo"
                        description="Xem các báo cáo và thống kê về thiết bị và tài khoản"
                        href="/reports"
                        icon="📊"
                    />
                    <DashboardCard
                        title="Cài đặt"
                        description="Quản lý cài đặt hệ thống và tùy chỉnh"
                        href="/settings"
                        icon="⚙️"
                    />
                </div>
            </main>

            <footer className="bg-muted py-6">
                <div className="container mx-auto text-center text-muted-foreground">
                    <p>© {new Date().getFullYear()} Hệ thống Quản lý Thiết bị & Tài khoản</p>
                </div>
            </footer>
        </div>
    )
}

function DashboardCard({
    title,
    description,
    href,
    icon,
}: {
    title: string
    description: string
    href: string
    icon: string
}) {
    return (
        <Link
            href={href}
            className="block p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{icon}</span>
                <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <p className="text-muted-foreground">{description}</p>
        </Link>
    )
} 