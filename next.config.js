/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Ignore native .node binary files
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    });

    // Externalize onnxruntime-node so webpack doesn't try to bundle native binaries
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      { 'onnxruntime-node': 'commonjs onnxruntime-node' },
    ];

    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
