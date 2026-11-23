// Default to Chromium for npm test. The companion tests can also exercise
// Firefox and WebKit using the corresponding Playwright browser downloads.
import { chromium, firefox, webkit } from 'playwright-core';

export function launchBrowser() {
  const name = process.env.TEST_BROWSER || 'chromium';
  if (name === 'chromium') {
    return chromium.launch({
      executablePath: process.env.CHROME_BIN || undefined,
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    });
  }
  if (name === 'firefox') return firefox.launch();
  if (name === 'webkit') return webkit.launch();
  throw Error('TEST_BROWSER must be chromium, firefox or webkit.');
}
