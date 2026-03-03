import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://nkufgygqbzhtacvoqgmi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jpLHfC3L8-Nvw4q4xcgTCw_Y0qA_m_0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const root = document.querySelector("#app");

function render(html){
  root.innerHTML = html;
}

async function getUser(){
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

async function isTeacher(){
  const user = await getUser();
  if(!user) return false;

  const { data } = await supabase
    .from("teacher_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return !!data;
}

async function loadResults(){
  const { data } = await supabase
    .from("results")
    .select("winners")
    .eq("id","current")
    .single();

  return data.winners ?? {};
}

async function saveResults(winners){
  const { error } = await supabase
    .from("results")
    .update({ winners })
    .eq("id","current");

  if(error) alert(error.message);
  else alert("Results saved.");
}

/* ============================
   SONG DATA
   ============================ */

const SONGS = {
  TQMQA:["TQMQA","Eladio Carrión"],
  AKAKAW:["Akakaw","Renata Flores"],
  ANGEL:["Ángel","Grupo Frontera & Romeo Santos"],
  TOCANDO:["Tocando el Cielo","Luis Fonsi"],
  REGALO:["Regalo","Alvaro Soler"],
  SISABES:["Si Sabes Contar","Los Ángeles Azules, Luck Ra, Yami Safdie"],
  AMULETO:["Amuleto","Diego Torres"],
  NARCISISTA:["Narcisista","The Warning"],
  COLEC:["Coleccionando Heridas","Karol G & Antonis Solís"],
  PARAQUE:["¿Para Qué?","Ela Taubert"],
  MUJER:["La Mujer que Soy","Fanny Lu"],
  BUENCAFE:["Buen Café","Efecto Pasillo"],
  GOODBYE:["Goodbye","Arthur Hanlon, Carlos Vives, Goyo"],
  FEB6:["6 de Febrero","Aitana"],
  LUNALLENA:["Luna Llena","Ebenezer Guerra & Elvis Crespo"],
  VUELA:["Vuela","Luck Ra & Ke Personaje"],
  BZRP:["Music Sessions #66","Daddy Yankee & BZRP"]
};

const BRACKET = [
  {
    title:"Round 0 (Play-In)",
    matches:[
      { id:"L-R0", a:"TQMQA", b:"AKAKAW" }
    ]
  },
  {
    title:"Round 1 (Left)",
    matches:[
      { id:"L-R1-1", a:"ANGEL", b:{from:"L-R0"} },
      { id:"L-R1-2", a:"TOCANDO", b:"REGALO" },
      { id:"L-R1-3", a:"SISABES", b:"AMULETO" },
      { id:"L-R1-4", a:"NARCISISTA", b:"COLEC" }
    ]
  },
  {
    title:"Round 1 (Right)",
    matches:[
      { id:"R-R1-1", a:"PARAQUE", b:"MUJER" },
      { id:"R-R1-2", a:"BUENCAFE", b:"GOODBYE" },
      { id:"R-R1-3", a:"FEB6", b:"LUNALLENA" },
      { id:"R-R1-4", a:"VUELA", b:"BZRP" }
    ]
  }
];

/* ============================
   RENDER LOGIC
   ============================ */

function getSongLabel(key){
  if(!key) return "Waiting...";
  const s = SONGS[key];
  return s ? `<strong>${s[0]}</strong><br><small>${s[1]}</small>` : "Waiting...";
}

function resolveSlot(slot,winners){
  if(typeof slot === "string") return slot;
  if(slot.from){
    const result = winners[slot.from];
    if(!result) return null;
    const prev = BRACKET.flatMap(r=>r.matches).find(m=>m.id===slot.from);
    return result==="A" ? prev.a : prev.b;
  }
}

function renderDashboard(winners){

  let html = `
    <div class="container">
      <h1>Set Official Results</h1>
      <button id="signout" class="danger">Sign out</button>
  `;

  BRACKET.forEach(round=>{
    html += `<div class="section-title">${round.title}</div>`;

    round.matches.forEach(match=>{
      const aKey = resolveSlot(match.a,winners);
      const bKey = resolveSlot(match.b,winners);

      html+=`
        <div class="card">
          <h3>${match.id}</h3>
          <div class="match">
            <div class="option ${winners[match.id]==="A"?"selected":""}"
                 data-id="${match.id}" data-slot="A">
              ${getSongLabel(aKey)}
            </div>
            <div class="option ${winners[match.id]==="B"?"selected":""}"
                 data-id="${match.id}" data-slot="B">
              ${getSongLabel(bKey)}
            </div>
          </div>
        </div>
      `;
    });
  });

  html+=`<button id="save" class="primary">Save Results</button></div>`;
  render(html);

  document.querySelectorAll(".option").forEach(btn=>{
    btn.onclick=()=>{
      winners[btn.dataset.id]=btn.dataset.slot;
      renderDashboard(winners);
    };
  });

  document.querySelector("#save").onclick=()=>saveResults(winners);
  document.querySelector("#signout").onclick=async()=>{
    await supabase.auth.signOut();
    init();
  };
}

/* ============================
   LOGIN
   ============================ */

function renderLogin(msg=""){
  render(`
    <div class="container">
      <h1>Teacher Login</h1>
      <input id="email" class="input" placeholder="Email" />
      <input id="pass" class="input" type="password" placeholder="Password" />
      <button id="login" class="primary">Sign in</button>
      ${msg?`<div class="error">${msg}</div>`:""}
    </div>
  `);

  document.querySelector("#login").onclick=async()=>{
    const email=document.querySelector("#email").value;
    const password=document.querySelector("#pass").value;

    const { error } = await supabase.auth.signInWithPassword({email,password});
    if(error) renderLogin(error.message);
    else init();
  };
}

/* ============================
   INIT
   ============================ */

async function init(){
  const user=await getUser();
  if(!user) return renderLogin();

  const teacher=await isTeacher();
  if(!teacher) return renderLogin("Not a teacher account.");

  const winners=await loadResults();
  renderDashboard(winners);
}

init();
