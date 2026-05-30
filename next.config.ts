import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Mock product/shop imagery during the prototype phase.
      { protocol: "https", hostname: "images.unsplash.com" },
      // Real product, shop, and avatar uploads go to Cloudinary on the
      // backend and we render the returned URLs via next/image. Allowlist
      // any cloud-name subpath under res.cloudinary.com.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Google OAuth users get their Google profile picture as avatarUrl.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
