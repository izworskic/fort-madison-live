import LiveRefresh from "../components/LiveRefresh";
import { getDashboardSnapshot } from "../lib/dashboard";
export const dynamic="force-dynamic";

export default async function Home(){
  const data=await getDashboardSnapshot();
  const site="https://chrisizworski.com/national-tools/fort-madison-live/";
  const methodology="https://chrisizworski.com/national-tools/fort-madison-live/methodology";
  const schema={"@context":"https://schema.org","@type":"WebApplication",name:"Fort Madison Live",url:site,applicationCategory:"TravelApplication",operatingSystem:"Web",description:"Predicts when Fort Madison train, tow and swing-bridge activity is worth watching, using live and scheduled rail and river signals.",areaServed:{"@type":"City",name:"Fort Madison",addressRegion:"IA"}};
  return <main>
    <header className="site-head">
      <a className="brand" href="https://chrisizworski.com/"><span className="brand-mark">FM</span><span><b>FORT MADISON</b><small>LIVE</small></span></a>
      <nav><a href="#live">Decision</a><a href="#camera">Camera</a><a href="#map">Map</a><a href="#how">How it works</a><a href={methodology}>Methodology</a></nav>
    </header>

    <section className="mast" id="live">
      <div>
        <span className="kicker">FORT MADISON · LIVE DECISION TOOL</span>
        <h1>Is it worth watching <em>right now?</em></h1>
        <p>Fort Madison Live predicts the next interesting moment at the Mississippi River crossing — a train, a commercial tow, or a likely swing-bridge opening — so you can decide whether to watch now or come back later.</p>
      </div>
      <div className="mast-badge"><span>THE DECISION</span><strong>Watch now or later?</strong><small>next event · best window · confidence · live camera</small></div>
    </section>

    <LiveRefresh initial={data}/>

    <section className="section explainer" id="how">
      <div className="section-head"><div><span className="kicker">HOW IT WORKS</span><h2>One question, three moving systems</h2></div><p>The engine turns rail, river and bridge signals into a simple watch decision instead of making you interpret the raw feeds yourself.</p></div>
      <div className="flow">
        <div><b>1</b><strong>See what is moving</strong><p>Passenger schedules, configured train observations and U.S. Army Corps lock records identify trains and named commercial tows moving toward Fort Madison.</p></div><i>→</i>
        <div><b>2</b><strong>Estimate the crossing window</strong><p>The engine estimates when each movement could reach the bridge and keeps uncertainty visible rather than pretending the timing is exact.</p></div><i>→</i>
        <div><b>3</b><strong>Make the watch call</strong><p>The page tells you whether there is something worth watching now, whether to return later, and what event the live camera should show next.</p></div>
      </div>
    </section>

    <section className="section seo-copy">
      <h2>What Fort Madison Live is actually for</h2>
      <p>The Fort Madison crossing is unusual because Mississippi River navigation and a busy rail corridor compete for the same moving bridge. Commercial navigation can require the swing span to open, temporarily interrupting rail traffic. That creates the interesting moments this tool is built to predict: <strong>when should I watch the crossing?</strong></p>
      <p>River stage comes from NOAA/NWS observations at gauge FMDI4. Named tow candidates come from U.S. Army Corps of Engineers Lock Performance Monitoring System observations at Locks 18 and 19. Southwest Chief #3 and #4 are identified exactly; when a live Amtrak provider is unavailable the tool labels their times as scheduled. Freight trains are displayed as identified movements only when a configured observation source supports them.</p>
    </section>

    <footer><div><b>Fort Madison Live</b><p>Independent interpretation tool. Not affiliated with BNSF, Amtrak, USACE, NOAA, YouTube or the live-stream publisher.</p></div><div><a href={methodology}>Methodology & data truth</a><a href="https://chrisizworski.com/national-tools/">More national tools</a></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
  </main>;
}
