/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for @metamask/sdk import issue in Next.js
    if (!isServer) {
        config.resolve.alias['@react-native-async-storage/async-storage'] = false;
        
        // Fix for Wagmi/WalletConnect dependencies
        config.resolve.alias['pino-pretty'] = false;
        config.resolve.alias['encoding'] = false;
        config.resolve.alias['bufferutil'] = false;
        config.resolve.alias['utf-8-validate'] = false;

        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false, 
          net: false, 
          tls: false
        };
    }
    // config.externals.push({ ... }) was forcing CommonJS which breaks browser builds
    return config;
  },
};

module.exports = nextConfig;
