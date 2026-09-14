import LiveRefresh from "../components/LiveRefresh";
import { getDashboardSnapshot } from "../lib/dashboard";
export const dynamic="force-dynamic";

export default async function Home(){
  const data=await getDashboardSnapshot();
  const site="https://chrisizworski.com/national-tools/fort-madison-live/";
  const methodology="https://chrisizworski.com/national-tools/fort-madison-live/methodology";
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
