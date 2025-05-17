// next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    backendAccessToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendAccessToken?: string;
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// import { Session } from "next-auth";

// declare module "next-auth" {
//   interface Session {
//     user?: {
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//     };
//     backendAccessToken?: string;
//     expires: string;
//   }
// }