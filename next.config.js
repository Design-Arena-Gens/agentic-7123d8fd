/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'fluent-ffmpeg',
      'ffmpeg-static',
      'ffprobe-static',
      'google-tts-api',
      'sharp',
      '@napi-rs/canvas',
      'googleapis'
    ]
  }
};

module.exports = nextConfig;
