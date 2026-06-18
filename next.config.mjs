/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Supabase Storage public URLs are served from your project domain.
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;
