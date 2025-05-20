"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FiHome,
    FiMonitor,
    FiCpu,
    FiUsers,
    FiClipboard,
    FiKey,
    FiMenu,
    FiX
} from "react-icons/fi";

export default function AppNavbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: <FiHome className="text-lg" /> },
        { href: "/devices", label: "Thiết bị", icon: <FiMonitor className="text-lg" /> },
        { href: "/components", label: "Linh kiện", icon: <FiCpu className="text-lg" /> },
        { href: "/employees", label: "Nhân viên", icon: <FiUsers className="text-lg" /> },
        { href: "/accounts", label: "Tài khoản hệ thống", icon: <FiKey className="text-lg" /> },
        { href: "/invoices", label: "Hóa đơn", icon: <FiClipboard className="text-lg" /> },
        { 
            href: "/users", 
            label: "Quản lý người dùng", 
            icon: <FiUsers className="text-lg" />,
            adminOnly: true
        },
    ];

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(`${path}/`);
    };

    // Không hiển thị navbar trong trang login
    if (pathname === "/login") {
        return null;
    }

    return (
        <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
            <div className="container mx-auto py-3 px-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <Link href="/dashboard" className="text-xl font-bold mr-6">
                            Device Management
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-1">
                            {navItems.map((item) => {
                                // Chỉ hiển thị các mục dành riêng cho admin nếu người dùng là admin
                                if (item.adminOnly && session?.user?.role !== "admin") {
                                    return null;
                                }
                                
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 ${isActive(item.href)
                                                ? "bg-primary-foreground/20 text-primary-foreground"
                                                : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                                            }`}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {session?.user?.name && (
                            <span className="text-sm hidden sm:inline-block">Xin chào, {session.user.name}</span>
                        )}
                        <Link
                            href="/api/auth/signout"
                            className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
                        >
                            Đăng xuất
                        </Link>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden p-2 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                            onClick={toggleMenu}
                        >
                            {isMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <nav className="md:hidden bg-primary-foreground/5 border-t border-primary-foreground/10 py-2 px-4">
                    <div className="flex flex-col space-y-2">
                        {navItems.map((item) => {
                            // Chỉ hiển thị các mục dành riêng cho admin nếu người dùng là admin
                            if (item.adminOnly && session?.user?.role !== "admin") {
                                return null;
                            }
                            
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${isActive(item.href)
                                            ? "bg-primary-foreground/20 text-primary-foreground"
                                            : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                                        }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}
        </header>
    );
} 