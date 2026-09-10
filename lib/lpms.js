function decode(s="") { return String(s).replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim(); }
function tag(row,name){ const m=row.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,"i")); return m ? decode(m[1].replace(/<[^>]+>/g,"")) : ""; }
export function parseLpmsXml(xml=""){
  const rows=[...String(xml).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/gi)].map(m=>m[1]);
  return rows.map(row=>({
    vessel_name:tag(row,"vessel_name"),
    vessel_no:tag(row,"vessel_no"),
    direction:tag(row,"direction"),
    num_barges:tag(row,"num_barges"),
    arrival_date:tag(row,"arrival_date"),
    end_of_lockage:tag(row,"end_of_lockage"),
    timezone:tag(row,"timezone")
  }));
}
