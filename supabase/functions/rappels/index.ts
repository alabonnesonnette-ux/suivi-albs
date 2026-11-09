// Fonction Supabase « rappels » — envoie les notifications de rappel (Suivi ALBS)
// Secrets à créer : VAPID_PUBLIC, VAPID_PRIVATE, CRON_SECRET
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || (() => { try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default; } catch { return ""; } })();
const sb = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE, { auth: { persistSession: false } });
webpush.setVapidDetails("mailto:alabonnesonnette@gmail.com", Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-cron-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
const FREQ: Record<string, number> = { once: 0, jour: 1, "2j": 2, semaine: 7 };

function parisNow() {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

async function send(nom: string, payload: Record<string, string>) {
  const { data } = await sb.from("docs").select("id,data").eq("coll", "push");
  const subs = (data || []).filter((r: any) => String(r.data?.personne || "").toLowerCase() === nom.toLowerCase());
  let ok = 0;
  for (const s of subs) {
    try { await webpush.sendNotification(s.data.sub, JSON.stringify(payload), { TTL: 86400 }); ok++; }
    catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await sb.from("docs").delete().eq("coll", "push").eq("id", s.id); else console.error("push", e?.statusCode, e?.body || e); }
  }
  return { telephones: subs.length, ok };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const body = await req.json().catch(() => ({}));
  const isCron = req.headers.get("x-cron-secret") === Deno.env.get("CRON_SECRET");
  if (!isCron) {
    const tok = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data } = await sb.auth.getUser(tok);
    if (!data?.user) return json({ erreur: "non autorisé" }, 401);
  }
  if (body.test) {
    const r = await send(String(body.test), { title: "🔔 Test Suivi ALBS", body: "Les rappels fonctionnent sur ce téléphone.", url: "./" });
    return json({ ...r, ok: r.ok > 0 });
  }
  const now = parisNow();
  const { data } = await sb.from("docs").select("id,data").eq("coll", "dossiers");
  let envoyes = 0;
  for (const r of data || []) {
    const d: any = r.data, R = d?.rappel;
    if (!R || !R.actif || !R.pour || d.statut === "clos") continue;
    if ((R.debut || "") > now.date || (R.heure || "09:00") > now.time) continue;
    const f = FREQ[R.freq] ?? 1;
    if (R.dernier && (f === 0 || daysBetween(R.dernier, now.date) < f)) continue;
    const res = await send(R.pour, { title: "🔔 Rappel · " + (d.logement || "Suivi ALBS"), body: d.titre || "Un suivi vous attend", url: "./?d=" + encodeURIComponent(r.id), tag: "rappel-" + r.id });
    const rappel = { ...R, dernier: now.date, dernierOk: res.ok, envois: (R.envois || 0) + 1, ...(f === 0 ? { actif: false } : {}) };
    await sb.from("docs").update({ data: { ...d, rappel } }).eq("coll", "dossiers").eq("id", r.id);
    envoyes++;
  }
  return json({ envoyes, heure: now });
});
