"use client"

import * as React from "react"
import { MdDarkMode, MdLightMode } from "react-icons/md"
import { useTheme } from "next-themes"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
            aria-label="Toggle theme"
        >
            {theme === "light" ? <MdDarkMode size={20} /> : <MdLightMode size={20} />}
        </button>
    )
} 