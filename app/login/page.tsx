"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError("Vui lòng nhập email và mật khẩu");
            return;
        }

        try {
            setError("");
            setLoading(true);

            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError(result.error);
                setLoading(false);
                return;
            }

            router.push("/dashboard");
        } catch (err) {
            setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
            setLoading(false);
        }
    };

    const handleMicrosoftSignIn = async () => {
        try {
            setError("");
            setLoading(true);
            await signIn('azure-ad', {
                callbackUrl: '/dashboard'
            });
        } catch (err) {
            setError("Đăng nhập Microsoft không thành công. Vui lòng thử lại sau.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="container mx-auto py-4 px-6 flex justify-end">
                <ModeToggle />
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg border">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Đăng nhập</h1>
                        <p className="text-muted-foreground mt-2">
                            Đăng nhập để quản lý thiết bị và tài khoản
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive text-destructive text-sm rounded-md">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border rounded-md bg-background"
                                placeholder="your.email@company.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border rounded-md bg-background"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition disabled:opacity-70"
                        >
                            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                        </button>
                    </form>

                    <div className="text-center text-sm">
                        <Link href="/" className="text-primary hover:underline">
                            Quay lại trang chủ
                        </Link>
                    </div>

                    <div className="mt-4 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-background text-muted-foreground">Hoặc</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleMicrosoftSignIn}
                        className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0078d4] hover:bg-[#106ebe] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0078d4]"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span>Đang xử lý...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 23 23" className="mr-2">
                                    <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                                    <path fill="#f35325" d="M1 1h10v10H1z" />
                                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                                </svg>
                                <span>Đăng nhập với Microsoft</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
} 