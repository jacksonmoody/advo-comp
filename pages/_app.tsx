import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

function AdvocateComp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Advocate Comp Project</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Realtime collaborative poetry board by the Harvard Advocate"
        />
        <meta property="og:site_name" key="ogsitename" content="advocate-comp" />
        <meta property="og:title" key="ogtitle" content="Advocate Comp" />
        <meta
          property="og:description"
          key="ogdesc"
          content="Realtime collaborative poetry board by the Harvard Advocate"
        />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default AdvocateComp
