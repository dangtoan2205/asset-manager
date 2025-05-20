import NextAuth from "next-auth";
import { Account, NextAuthOptions, Profile, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import connectDB from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import UserModel from "@/models/User";

// Define user interface
interface DBUser {
    _id: string;
    email: string;
    password?: string;
    name: string;
    role: string;
    provider?: string;
    providerAccountId?: string;
}

// Define the auth options
export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Vui lòng nhập email và mật khẩu");
                }

                await connectDB();
                const db = mongoose.connection?.db;

                if (!db) {
                    throw new Error("Database connection failed");
                }

                const user = await db.collection("users").findOne({
                    email: credentials.email,
                });

                if (!user || !user.password) {
                    throw new Error("Không tìm thấy người dùng");
                }

                const isPasswordMatch = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordMatch) {
                    throw new Error("Mật khẩu không chính xác");
                }

                // Update last login time
                await db.collection("users").updateOne(
                    { _id: user._id },
                    { $set: { lastLogin: new Date() } }
                );

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID,
            authorization: {
                params: {
                    scope: "openid profile email"
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user, account, profile }: { token: JWT; user?: User; account?: Account | null; profile?: Profile }) {
            if (user) {
                token.id = user.id;
                // Đảm bảo vai trò được xử lý đúng cách
                if ((user as any).role) {
                    token.role = (user as any).role;
                    console.log("User role set in JWT:", (user as any).role);
                }
            }

            // Store the provider used to sign in
            if (account) {
                token.provider = account.provider;
                token.providerAccountId = account.providerAccountId;
            }

            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).provider = token.provider;
                // Log để debug
                console.log("Session user role:", (session.user as any).role);
            }
            return session;
        },
        async signIn({ user, account, profile }) {
            // For Azure AD authentication, we need to create or sync the user in our database
            if (account?.provider === 'azure-ad' && profile) {
                try {
                    await connectDB();

                    // Use Mongoose model instead of raw connection
                    const existingUser = await UserModel.findOne({
                        $or: [
                            { email: profile.email },
                            {
                                provider: 'azure-ad',
                                providerAccountId: account.providerAccountId
                            }
                        ]
                    });

                    // If user exists, update their info
                    if (existingUser) {
                        await UserModel.updateOne(
                            { _id: existingUser._id },
                            {
                                $set: {
                                    name: profile.name || existingUser.name,
                                    email: profile.email || existingUser.email,
                                    provider: 'azure-ad',
                                    providerAccountId: account.providerAccountId,
                                    lastLogin: new Date()
                                }
                            }
                        );

                        // Update the user object with role from DB for the JWT token
                        user.id = existingUser._id.toString();
                        (user as any).role = existingUser.role;
                    } else {
                        // Create new user
                        const newUser = await UserModel.create({
                            name: profile.name,
                            email: profile.email,
                            role: "user", // Default role
                            provider: "azure-ad",
                            providerAccountId: account.providerAccountId,
                            isActive: true,
                            lastLogin: new Date()
                        });

                        // Update the user object for the JWT token
                        user.id = newUser._id.toString();
                        (user as any).role = "user";
                    }

                    return true;
                } catch (error) {
                    console.error("Error during Azure AD sign in:", error);
                    return false;
                }
            }

            return true;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };