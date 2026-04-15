import Document, { Html, Head, Main, NextScript } from 'next/document';
import { ColorSchemeScript } from '@mantine/core';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="fr">
        <Head>
          <ColorSchemeScript defaultColorScheme="dark" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
