# FlareAlbum

<p align="center">
  <img src="https://raw.githubusercontent.com/dlzmoe/flarealbum/refs/heads/main/public/logo.webp" alt="FlareAlbum Logo" width="200">
</p>

<p align="center">
  <strong>Convenient and efficient Cloudflare R2 image hosting management tool.</strong>
</p>

<p align="center">
  <a href="https://flarealbum.zishu.me" target="_blank">🌐 Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#usage-guide">Usage Guide</a> •
  <a href="#requirements">Requirements</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#license">License</a> •
  <a href="README.md">中文</a>
</p>

## Introduction

FlareAlbum is an image hosting management tool built with Vue 3 and Ant Design Vue, specifically designed for Cloudflare R2 storage. Through an intuitive interface, you can easily upload, manage, and share images while benefiting from Cloudflare CDN's global acceleration.

## Features

- **Simple Configuration** - Easy setup for S3-compatible Cloudflare R2 storage buckets
- **Efficient Upload** - Support for drag-and-drop uploads, batch uploads, custom paths and filenames
- **Auto Compression** - Customizable compression levels with WebP format conversion
- **File Management** - Folder structure management with preview, delete, and copy link operations
- **Custom Domain** - Support for custom domain configuration to optimize image access links
- **Local Caching** - Intelligent caching mechanism for improved browsing and management efficiency
- **Responsive Design** - Adapts to various screen sizes with list/grid view switching
- **Secure Storage** - Local encrypted storage for bucket configuration without exposing sensitive information

|||
|---|---|
|![image](https://github.com/user-attachments/assets/1cbb9d39-83a5-47f7-96bd-c22c10558003)|![image](https://github.com/user-attachments/assets/8f152002-4abf-4513-9aec-07b09c12c9a2)|
|![image](https://github.com/user-attachments/assets/24a504cf-d59a-4e0a-a92e-ddcf28eacaae)|![image](https://github.com/user-attachments/assets/50b2657a-a9e7-4479-92c1-8d312b94040f)|

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/dlzmoe/flarealbum.git

# Navigate to project directory
cd flarealbum

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Build for production
npm run build
```

## Usage Guide

### 1. S3 Configuration

First, configure your Cloudflare R2 storage:

- Navigate to the `S3 Configuration` page
- Fill in the following information:
  - Endpoint URL (e.g., `https://<account-id>.r2.cloudflarestorage.com`)
  - Bucket name
  - Access Key ID
  - Secret Access Key
  - Region (usually `auto`)

### 2. Upload Images

- Navigate to the `Upload Images` page
- Select or drag files to the upload area
- Set upload path and file naming rules
- Click the `Start Upload` button

### 3. Manage Images

- Navigate to the `Image Management` page
- Browse folders and images
- Support for preview, copy links, and delete operations
- Support for list/grid view switching

### 4. Personal Settings

- Navigate to the `My Settings` page
- Configure default upload path
- Set custom domain prefix
- Choose default copy format (URL/Markdown/HTML)
- Set file naming rules

## Requirements

- Node.js 16.0+
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Cloudflare R2 storage bucket and access credentials

## Tech Stack

- [Vue 3](https://v3.vuejs.org/) - Progressive JavaScript framework
- [Vite](https://vitejs.dev/) - Next generation frontend build tool
- [Ant Design Vue](https://antdv.com/) - Enterprise-level UI component library
- [AWS SDK for JavaScript](https://aws.amazon.com/sdk-for-javascript/) - S3 operations SDK

## Contributing

We welcome contributions, bug reports, and feature suggestions! Please check the [Contributing Guide](CONTRIBUTING.md) for more information.

## License

[Apache-2.0 license](LICENSE)

---

<p align="center">
  Developed and maintained by <a href="https://github.com/dlzmoe">dlzmoe</a>
</p> 