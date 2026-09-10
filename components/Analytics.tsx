import Script from "next/script";

const NETWORK_GA_ID="G-Y5D2V2W7HN";

export default function Analytics(){
  const id=process.env.NEXT_PUBLIC_GA_ID || NETWORK_GA_ID;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    <Script id="fort-madison-ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${id}',{send_page_view:true});`}</Script>
  </>;
}
