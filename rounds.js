import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://nkufgygqbzhtacvoqgmi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jpLHfC3L8-Nvw4q4xcgTCw_Y0qA_m_0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const root = document.querySelector("#app");

const MATCHES = [
  "L-R0",
  "L-R1-1","L-R1-2","L-R1-3","L-R1-4",
  "R-R1-1","R-R1-2","R-R1-3","R-R1-4",
  "L-QF-1","L-QF-2",
  "R-QF-1","R-QF-2",
  "L-SF","R-SF",
  "FINAL"
];

function render(html) {
  root.innerHTML = html;
}

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

async function checkTeacher() {
  const { data } = await supabase
    .from("teacher_profiles")
    .select("user_id")
    .limit(1);

  return data?.length === 1;
}

async function loadResults() {
  const { data } = await supabase
    .from("results")
    .select("winners")
    .eq("id", "main")
    .single();

  return data?.winners ?? {};
}

async function saveResults(winners) {
  const { error } = await supabase
    .from("results")
    .update({ winners })
    .eq("id", "main");

  if (error) alert(error.message);
  else alert("Results saved.");
}

function matchCard(matchId, currentWinner) {
  return `
    <div class="card">
      <h3>${matchId}</h3>
      <div style="display:flex;gap:10px;">
        <button class="btn ${currentWinner==="A"?"primary":""}" data-match="${matchId}" data-slot="A">A</button>
        <button class="btn ${currentWinner==="B"?"primary":""}" data-match="${matchId}" data-slot="B">B</button>
      </div>
    </div>
  `;
}

async function main() {
  const user = await getSession();

  if (!user) {
    render(`
      <div class="container">
        <h2>Teacher Login Required</h2>
        <button id="login" class="btn primary">Sign in</button>
      </div>
    `);
    document.querySelector("#login").onclick = () => {
      supabase.auth.signInWithPassword({
        email: prompt("Email"),
        password: prompt("Password")
      });
    };
    return;
  }

  const isTeacher = await checkTeacher();
  if (!isTeacher) {
    render(`<div class="container"><h2>Access denied</h2></div>`);
    return;
  }

  let winners = await loadResults();

  render(`
    <div class="container">
      <h2>Set Round Results</h2>
      <div id="matches"></div>
      <button id="save" class="btn primary">Save All</button>
    </div>
  `);

  const matchesEl = document.querySelector("#matches");
  matchesEl.innerHTML = MATCHES
    .map(m => matchCard(m, winners[m]))
    .join("");

  document.querySelectorAll("button[data-match]").forEach(btn => {
    btn.onclick = (e) => {
      const match = e.target.dataset.match;
      const slot = e.target.dataset.slot;
      winners[match] = slot;
      main(); // re-render
    };
  });

  document.querySelector("#save").onclick = () => saveResults(winners);
}

main();
