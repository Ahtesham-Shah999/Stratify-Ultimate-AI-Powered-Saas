
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { checkEmailApi } from "@/lib/userapi";
async function findUserInDB(email: string | null | undefined) {
  if (!email) return null;

  try {
    const res = await checkEmailApi(email); // call backend
    if (res.exists) return res; // { token, user }
    return null;
  } catch (err) {
    console.error("Error checking user in DB:", err);
    return null;
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      const backendUser = await findUserInDB(user.email);

      if (backendUser) {
        // Pass the token as query param to client page
        return `/auth/set-token?token=${backendUser.token}`;
      } else {
        return "/login";
      }
    },

    async redirect({ url, baseUrl }) {
      return url; // respect the redirect URL set above
    },
  },
});

export { handler as GET, handler as POST };
