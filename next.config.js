/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for @metamask/sdk import issue in Next.js
    if (!isServer) {
        config.resolve.alias['@react-native-async-storage/async-storage'] = false;
    }
    return config;
  },
};

module.exports = nextConfig;
