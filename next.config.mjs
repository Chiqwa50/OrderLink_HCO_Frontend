/** @type {import('next').NextConfig} */
const nextConfig = {
  // See https://lucide.dev/guide/packages/lucide-react#nextjs-example
  transpilePackages: ["lucide-react"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
