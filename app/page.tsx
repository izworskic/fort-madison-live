import LiveRefresh from "../components/LiveRefresh";
import { getDashboardSnapshot } from "../lib/dashboard";
export const dynamic="force-dynamic";

export default async function Home(){
  const data=await getDashboardSnapshot();
  const site="https://chrisizworski.com/national-tools/fort-madison-live/";
  const methodology="https://chrisizworski.com/national-tools/fort-madison-live/methodology";
  const towPhoto="https://live.staticflickr.com/65535/52678511502_b202188ebf.jpg";
  const towPhotoPage="https://www.flickr.com/photos/string_bass_dave/52678511502/";
  const trainPhoto="https://upload.wikimedia.org/wikipedia/commons/a/a2/Kansas_Cityan_crossing_the_Mississippi_at_Fort_Madison.jpg";
  const trainPhotoPage="https://commons.wikimedia.org/wiki/File:Kansas_Cityan_crossing_the_Mississippi_at_Fort_Madison.jpg";
  const schema={
    "@context":"https://schema.org",
    "@graph":[
      {"@type":"WebApplication",name:"Fort Madison Bridge Opening & Train Watch",url:site,applicationCategory:"TravelApplication",operatingSystem:"Web",description:"Predict likely Fort Madison swing bridge opening windows from commercial tow activity and combine them with train timing, the Southwest Chief and a live camera.",areaServed:{"@type":"City",name:"Fort Madison",addressRegion:"IA"}},
      {"@type":"FAQPage",mainEntity:[
        {"@type":"Question",name:"When does the Fort Madison swing bridge open?",acceptedAnswer:{"@type":"Answer",text:"There is no simple public daily opening schedule. River traffic has right-of-way, so openings depend on approaching vessels. Fort Madison Live uses recent commercial tow observations from nearby Mississippi River locks to estimate watch windows; estimates are not official bridge schedules."}},
        {"@type":"Question",name:"How often does the Fort Madison bridge open?",acceptedAnswer:{"@type":"Answer",text:"Fort Madison tourism materials report roughly 2,000 swing-span openings per year for river traffic, with a typical tow opening lasting about 15 to 20 minutes."}},
        {"@type":"Question",name:"Can I watch trains live in Fort Madison?",acceptedAnswer:{"@type":"Answer",text:"Yes. This page includes a live Fort Madison camera and combines it with train, tow and bridge-opening timing so visitors can decide when the stream is most likely to be interesting."}}
      ]}
    ]
  };
  return <main>
    <style dangerouslySetInnerHTML={{__html:`
      .purpose-mast{grid-template-columns:minmax(0,.92fr) minmax(420px,1.08fr);align-items:center;padding-top:28px}
      .purpose-mast .mast-lede{max-width:690px}
      .hero-real-media{position:relative;min-height:470px;margin:0}
      .hero-main-photo{position:absolute;inset:0 54px 42px 0;margin:0;border-radius:28px;overflow:hidden;background:#0d1719;box-shadow:0 24px 70px rgba(12,29,31,.2)}
      .hero-main-photo img{width:100%;height:100%;object-fit:cover;display:block}
      .hero-main-photo:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 48%,rgba(7,22,24,.78) 100%);pointer-events:none}
      .hero-main-photo figcaption{position:absolute;z-index:2;left:20px;right:20px;bottom:17px;color:white;font-size:13px;line-height:1.45}
      .hero-main-photo figcaption strong{display:block;font-size:15px;margin-bottom:3px}
      .hero-main-photo figcaption small{display:block;color:#d7e0de;margin-top:5px;font-size:10px}
      .hero-train-photo{position:absolute;right:0;bottom:0;width:220px;margin:0;border:6px solid var(--paper);border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 18px 50px rgba(16,42,43,.24)}
      .hero-train-photo img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}
      .hero-train-photo figcaption{padding:9px 10px 10px;background:#fff;font-size:10px;line-height:1.35;color:var(--muted)}
      .hero-photo-label{display:inline-block;margin-bottom:6px;padding:5px 8px;border-radius:999px;background:rgba(198,90,53,.92);font-size:9px;font-weight:900;letter-spacing:.12em}
      .hero-real-media a{color:inherit}
      @media(max-width:980px){.purpose-mast{grid-template-columns:1fr}.hero-real-media{min-height:430px;margin-top:8px}.hero-main-photo{inset:0 42px 36px 0}}
      @media(max-width:620px){.hero-real-media{min-height:330px}.hero-main-photo{inset:0 22px 28px 0;border-radius:20px}.hero-train-photo{width:145px;border-width:4px;border-radius:14px}.hero-main-photo figcaption{left:14px;right:14px;bottom:12px;font-size:11px}.hero-main-photo figcaption strong{font-size:13px}}
    `}}/>
    <header className="site-head">
      <a className="brand" href="https://chrisizworski.com/"><span className="brand-mark">FM</span><span><b>FORT MADISON</b><small>BRIDGE + TRAIN WATCH</small></span></a>
      <nav><a href="#watch">Watch board</a><a href="#camera">Live camera</a><a href="#map">Map</a><a href="#today">Today</a><a href={methodology}>Data</a></nav>
    </header>

    <section className="mast purpose-mast" id="live">
      <div>
        <span className="kicker">FORT MADISON · IOWA · MISSISSIPPI RIVER</span>
        <h1>Catch the swing. <em>Know when to watch.</em></h1>
        <p className="mast-lede">The Fort Madison bridge moves for river traffic while one of America’s busiest rail corridors crosses below. This tool uses tow observations, train timing and the live camera to answer one useful question: <strong>when is something worth seeing?</strong></p>
        <div className="intent-links"><a href="#watch">Will the bridge open soon?</a><a href="#today">What trains are coming?</a><a href="#camera">Is the camera worth watching now?</a></div>
      </div>
      <div className="hero-real-media" aria-label="Real photographs of the Fort Madison bridge in operation">
        <figure className="hero-main-photo">
          <img src={towPhoto} alt="Real photograph of a tow passing through the opened Fort Madison swing bridge on the Mississippi River" loading="eager" fetchPriority="high"/>
          <figcaption><span className="hero-photo-label">BRIDGE OPEN</span><strong>This is the event the tool is trying to help you catch.</strong>A tow passes through the swung span while road and rail traffic wait for the crossing to close again.<small>Real photo: David Brossard · <a href={towPhotoPage} target="_blank" rel="noreferrer">Flickr</a> · CC BY-SA 2.0</small></figcaption>
        </figure>
        <figure className="hero-train-photo">
          <img src={trainPhoto} alt="Historic real photograph of a passenger train crossing the Fort Madison bridge" loading="eager"/>
          <figcaption>Train crossing the same bridge. Public-domain Santa Fe Railway image. <a href={trainPhotoPage} target="_blank" rel="noreferrer">Source ↗</a></figcaption>
        </figure>
      </div>
    </section>

    <section className="fact-ribbon" aria-label="Why Fort Madison is unusual">
      <div><strong>60–80</strong><span>trains on the riverfront on a typical day</span></div>
      <div><strong>~2,000</strong><span>bridge openings reported each year</span></div>
      <div><strong>River first</strong><span>commercial navigation has right-of-way</span></div>
      <div><strong>15–20 min</strong><span>typical opening for a tow with barges</span></div>
    </section>

    <LiveRefresh initial={data}/>

    <section className="section why-section" id="how">
      <div className="section-head"><div><span className="kicker">WHY THIS TOOL EXISTS</span><h2>The camera shows now. The engine tries to tell you what happens next.</h2></div></div>
      <div className="why-copy">
        <p>A railcam alone makes you wait. A train schedule misses freight traffic. A river lock page tells you what happened miles away. Fort Madison Live combines those separate signals so a railfan, traveler or local visitor can decide whether to head to the riverfront, keep the camera open, or come back later.</p>
        <p>The most distinctive target is the bridge opening. A named tow observed at Lock 18 or Lock 19 creates a modeled arrival window at Fort Madison. When that window overlaps a train arrival, the page calls out the higher-interest convergence instead of making you do the math.</p>
      </div>
    </section>

    <section className="section search-intent-section">
      <span className="kicker">FORT MADISON RAILFAN GUIDE</span>
      <h2>What people come here to see</h2>
      <div className="intent-grid">
        <article><strong>Swing bridge openings</strong><p>The 525-foot swing span opens for Mississippi River traffic. This tool’s tow model is designed to surface the next plausible opening window.</p></article>
        <article><strong>Southwest Chief</strong><p>Amtrak’s Chicago–Los Angeles Southwest Chief stops at the historic Santa Fe Depot and crosses the bridge. The watch board keeps the next identifiable passenger move visible.</p></article>
        <article><strong>BNSF Transcon traffic</strong><p>Fort Madison is a major railfan destination because the BNSF transcontinental corridor runs directly along the riverfront and across the moving bridge.</p></article>
        <article><strong>River + rail together</strong><p>The rarest moment is when a tow-driven bridge window and a train approach overlap. That convergence is the event this engine can make easier to catch.</p></article>
      </div>
    </section>

    <footer><div><b>Fort Madison Bridge + Train Watch</b><p>Independent prediction and interpretation tool. Modeled bridge-opening windows are estimates, not official BNSF bridge schedules.</p></div><div><a href={methodology}>Methodology & data truth</a><a href="https://www.visitfortmadison.com/railfanning" target="_blank" rel="noreferrer">Official Fort Madison railfanning guide ↗</a><a href="https://chrisizworski.com/national-tools/">More national tools</a></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
  </main>;
}
