import "next-auth";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    /**
     * Extend the built-in session types
     */
    interface Session {
        user: {
            id: string;
            role: string;
            provider?: string;
        } & DefaultSession["user"];
    }

    /**
     * Extend the built-in user types
     */
    interface User extends DefaultUser {
        role?: string;
        provider?: string;
        providerAccountId?: string;
    }
}

declare module "next-auth/jwt" {
    /**
     * Extend the built-in JWT types
     */
    interface JWT {
        id?: string;
        role?: string;
        provider?: string;
        providerAccountId?: string;
    }
} 