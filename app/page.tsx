import LiveRefresh from "../components/LiveRefresh";
import { getDashboardSnapshot } from "../lib/dashboard";
export const dynamic="force-dynamic";

export default async function Home(){
  const data=await getDashboardSnapshot();
  const site="https://chrisizworski.com/national-tools/fort-madison-live/";
  const methodology="https://chrisizworski.com/national-tools/fort-madison-live/methodology";
  const schema={"@context":"https://schema.org","@type":"WebApplication",name:"Fort Madison Live",url:site,applicationCategory:"TravelApplication",operatingSystem:"Web",description:"Live decision-support tool for rail and Mississippi River activity at the Fort Madison swing bridge.",areaServed:{"@type":"City",name:"Fort Madison",addressRegion:"IA"}};
  return <main>
    <header className="site-head">
      <a className="brand" href="https://chrisizworski.com/"><span className="brand-mark">FM</span><span><b>FORT MADISON</b><small>LIVE</small></span></a>
      <nav><a href="#live">Live</a><a href="#camera">Camera</a><a href="#map">Map</a><a href="#how">How it works</a><a href={methodology}>Methodology</a></nav>
    </header>

    <section className="mast" id="live">
      <div>
        <span className="kicker">FORT MADISON · IOWA · LIVE</span>
        <h1>Trains. Tows. <em>One moving bridge.</em></h1>
        <p>Watch the crossing live and see what is likely to happen next. Fort Madison Live combines rail, river and swing-bridge timing into one visitor-friendly view.</p>
      </div>
      <div className="mast-badge"><span>THE IDEA</span><strong>Watch + predict</strong><small>live camera · event engine · map</small></div>
    </section>

    <LiveRefresh initial={data}/>

    <section className="section explainer" id="how">
      <div className="section-head"><div><span className="kicker">HOW IT WORKS</span><h2>Three systems, one useful answer</h2></div><p>The page separates what is directly observed from what is inferred, then uses the overlap to tell you what is worth watching.</p></div>
      <div className="flow">
        <div><b>1</b><strong>Identify</strong><p>Official passenger schedules, configured freight observations and USACE lock records establish actual trains and named tows.</p></div><i>→</i>
        <div><b>2</b><strong>Predict</strong><p>Along-corridor travel windows estimate when each movement may reach Fort Madison. Uncertainty stays visible.</p></div><i>→</i>
        <div><b>3</b><strong>Watch</strong><p>The engine compares rail arrival windows with likely bridge-use windows so you know when the live camera is most worth checking.</p></div>
      </div>
    </section>

    <section className="section seo-copy">
      <h2>Fort Madison bridge, train and barge activity in one place</h2>
      <p>The Fort Madison crossing is unusual: a Mississippi River navigation channel passes through a rotating railroad bridge carrying BNSF and Amtrak traffic. Commercial navigation has priority, so approaching tows can create bridge openings that temporarily make the rail crossing unavailable. Fort Madison Live is designed to answer the visitor question that ordinary railcams cannot: <strong>what is coming next?</strong></p>
      <p>River stage comes from NOAA/NWS observations at gauge FMDI4. Named tow candidates come from U.S. Army Corps of Engineers Lock Performance Monitoring System observations at Locks 18 and 19. Southwest Chief #3 and #4 are identified exactly; when a live Amtrak provider is unavailable the tool labels their times as scheduled. Freight trains are displayed as identified movements only when a licensed or partner observation feed is configured.</p>
    </section>

    <footer><div><b>Fort Madison Live</b><p>Independent interpretation tool. Not affiliated with BNSF, Amtrak, USACE, NOAA, SkylineWebcams, Virtual Railfan or YouTube.</p></div><div><a href={methodology}>Methodology & data truth</a><a href="https://chrisizworski.com/national-tools/">More national tools</a></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
  </main>;
}
