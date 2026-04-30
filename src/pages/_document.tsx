import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';
import { themeBootstrapScript } from '@/utils/themeBootstrap';

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        {/* PWA manifest and theme */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#020617" media="(prefers-color-scheme: dark)" />

        {/* iOS Web App configuration */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AxionVera" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />

        {/* For critical theme initialization that must run before React mounts */}
        <Script
          id="theme-bootstrap-critical"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        {/* For environment config that can load slightly later */}
        <Script src="/env-config.js" strategy="afterInteractive" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}