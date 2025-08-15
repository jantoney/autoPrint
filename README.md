# My Note Printer

I was doom scrolling on YouTube one day, and there was a video about 'Fixing your life with a receipt printer'... or something to that effect.
I've been mulling it over, and had a spare receipt printer lying around, so I thought, why not?

This app is simple. Really simple.
You type in a note, and it gets printed on a receipt printer.
My receipt printer has a automatic cutter on it (most do these days).
Then I stick it into a docker holder you find in a commercial kitchen.

A receipt printer is cheap from ebay/alliexpress/etc.
Docker holders are dime and a dozen from Amazon/Aliexpress/etc.

It works well - let me know if you have any issues.


## Supported Printers

In reality, any printer will work because the application sends print jobs in a standard format that most printers can understand.
However this was built for a receipt printer with a paper width of 80mm.

## My learnings with cheap printers

The random printer I had lying around was a no-name brand model `WG-8200`.
It has Serial, USB, and Ethernet connectivity options and was resold as under the `Dailypos` brand in Australia.
If you turn the unit off, press the `Feed` button, turn it on and continue to press for a good 20-30 seconds, it will eventually print out a `Selftest` page.
This will have the IP address and supported features listed on it.

Logging onto the website (ip address) of the printer, it had this printed at the bottom of the page:
`Copyright © Lee 2006-2018 J-Speed All rights reserved.`

This was my only clue to the printer's origins and a potential driver.
Turns out that `J-Speed` is just an OEM manufacturer that rebrands printers for other companies.

The TL/DR of this is that if you have a cheap printer lying around, then the [Bill product driver](https://www.xprintertech.com/drivers-2.html) from `Xprinter` will most likely work.
It sounds like the printer just has to have `ESC/POS` compatibility. Which mine had also printed on the bottom on the device model number sticker.

## Development

### Prerequisites

- Node.js (LTS version)
- pnpm package manager
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/jantoney/autoPrint.git
cd autoPrint

# Install dependencies
pnpm install

# Start the development server
pnpm start
```

### Building the Application

```bash
# Build for Windows
pnpm run dist
```

This will create distributable files in the `dist/` directory, including:

- NSIS installer (.exe)
- Portable zip archive

## Publishing & Release Management

This project uses automated GitHub Actions for building and releasing the application.

### Creating a New Release

The application uses semantic versioning (MAJOR.MINOR.PATCH). To create a new release:

#### Option 1: Automated Version Bump (Recommended)

```bash
# For bug fixes (1.0.0 → 1.0.1)
pnpm run version:patch

# For new features (1.0.0 → 1.1.0)
pnpm run version:minor

# For breaking changes (1.0.0 → 2.0.0)
pnpm run version:major
```

These commands will:

1. Automatically increment the version in `package.json`
2. Create a git commit with the version bump
3. Create a git tag (e.g., `v1.0.1`)
4. Push the changes and tag to GitHub
5. Trigger the automated build and release process

#### Option 2: Manual Version Management

```bash
# 1. Update version in package.json manually
# 2. Commit the changes
git add package.json
git commit -m "Bump version to 1.1.0"

# 3. Create and push the tag
git tag v1.1.0
git push origin main
git push origin v1.1.0
```

### Automated Release Process

When a version tag is pushed to GitHub (format: `v*.*.*`), the GitHub Actions workflow automatically:

1. **Builds the application** using electron-builder
2. **Creates Windows distributables** (NSIS installer + ZIP archive)
3. **Creates a GitHub release** with the version tag
4. **Uploads the built files** as release assets
5. **Makes the release available** for download

### Release Assets

Each release includes:

- `My Note Printer-v{version}-x64.exe` - NSIS installer for Windows
- `My Note Printer-v{version}-win.zip` - Portable ZIP archive

### Monitoring Releases

- **View build progress**: [GitHub Actions](https://github.com/jantoney/autoPrint/actions)
- **Download releases**: [GitHub Releases](https://github.com/jantoney/autoPrint/releases)
- **Latest release**: The most recent version is always available at the releases page

### Troubleshooting

If a release fails:

1. Check the [Actions tab](https://github.com/jantoney/autoPrint/actions) for error details
2. Ensure your `package.json` version follows semantic versioning
3. Verify that the git tag format matches `v*.*.*` (e.g., `v1.0.0`)
4. Check that all files are committed before running version commands
