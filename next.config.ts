import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'googleapis',
    'google-auth-library',
    'googleapis-common',
    'gaxios',
    'gcp-metadata',
    'node-fetch',
    'agent-base',
    'https-proxy-agent',
    'fetch-blob',
  ],
};

export default nextConfig;
