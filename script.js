// script.js — cleaned and improved
document.addEventListener('DOMContentLoaded', init);

function init(){
  navInit();
  modelInit();
  carbonInit(); // keeps carbon animation safe if svg elements are present
}

// NAV
function navInit(){
  const btn = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  if(!btn || !nav) return;

  btn.addEventListener('click', ()=>{
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    nav.style.display = expanded ? 'none' : 'flex';
  });

  // reset nav display on resize for desktop
  window.addEventListener('resize', ()=> {
    if(window.innerWidth > 980){
      nav.style.display = 'flex';
    } else {
      nav.style.display = 'none';
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  // initial state (mobile friendly)
  if(window.innerWidth <= 980){
    nav.style.display = 'none';
    btn.setAttribute('aria-expanded', 'false');
  } else {
    nav.style.display = 'flex';
  }
}

// POPULATION MODEL & CHART
function modelInit(){
  const canvas = document.getElementById('populationChart');
  if(!canvas) return;

  // controls
  const resource = document.getElementById('resource');
  const fishing = document.getElementById('fishing');
  const pollution = document.getElementById('pollution');
  const resVal = document.getElementById('resVal');
  const fishVal = document.getElementById('fishVal');
  const pollVal = document.getElementById('pollVal');
  const parCount = document.getElementById('parCount');
  const sharkCount = document.getElementById('sharkCount');
  const carryVal = document.getElementById('carryVal');

  function updateLabels(){
    if(resVal) resVal.textContent = resource.value;
    if(fishVal) fishVal.textContent = fishing.value;
    if(pollVal) pollVal.textContent = pollution.value;
  }
  resource.addEventListener('input', updateLabels);
  fishing.addEventListener('input', updateLabels);
  pollution.addEventListener('input', updateLabels);
  updateLabels();

  // Chart.js setup
  const ctx = canvas.getContext('2d');
  const labels = Array.from({length:51}, (_,i)=> i);
  const data = {
    labels,
    datasets:[
      { label:'Parrotfish', data:Array(51).fill(0), borderColor:'#0ea5a4', fill:false, tension:0.2 },
      { label:'Lemon sharks', data:Array(51).fill(0), borderColor:'#0b7285', fill:false, tension:0.2 },
      { label:'Carrying capacity', data:Array(51).fill(0), borderColor:'#6b7280', borderDash:[6,6], fill:false }
    ]
  };

  const chart = new Chart(ctx, { type:'line', data, options:{ animation:false, scales:{ y:{ beginAtZero:true } } } });

  function computeK(res,poll){
    const base = 150;
    const k = Math.max(10, Math.round(base * (res/100) * (1 - poll/300)));
    return k;
  }

  function runSim(steps=50){
    const res = Number(resource.value);
    const fish = Number(fishing.value);
    const poll = Number(pollution.value);
    const K = computeK(res,poll);
    if(carryVal) carryVal.textContent = K;

    let P = Math.round(K * 0.6); // parrotfish initial
    let S = Math.max(5, Math.round(P/12)); // sharks initial

    const rP = 0.45 * (res/100 + 0.5);
    const rS = 0.18;

    const parArr = [];
    const shArr = [];
    const Karr = [];

    for(let t=0;t<=steps;t++){
      parArr.push(P);
      shArr.push(S);
      Karr.push(K);

      // harvest and interactions
      const harvestP = Math.round(P * (fish/600));
      const predation = Math.round(0.03 * S);
      const newP = Math.round(P + rP * P * (1 - P / K) - harvestP - predation);

      const harvestS = Math.round(S * (fish/900));
      const preyFactor = Math.max(0, P/80);
      const newS = Math.round(S + rS * S * (preyFactor) - harvestS);

      P = Math.max(0, newP);
      S = Math.max(0, newS);
    }

    chart.data.datasets[0].data = parArr;
    chart.data.datasets[1].data = shArr;
    chart.data.datasets[2].data = Karr;
    chart.update();

    if(parCount) parCount.textContent = parArr[parArr.length-1];
    if(sharkCount) sharkCount.textContent = shArr[shArr.length-1];
  }

  // buttons
  const runBtn = document.getElementById('runBtn');
  const resetBtn = document.getElementById('resetBtn');
  if(runBtn) runBtn.addEventListener('click', ()=> runSim(50));
  if(resetBtn) resetBtn.addEventListener('click', ()=>{
    resource.value = 80; fishing.value = 30; pollution.value = 40;
    updateLabels();
    runSim(50);
  });

  // initial run
  runSim(50);
}

// CARBON ANIMATION (safe guard)
function carbonInit(){
  const btn = document.getElementById('animateCarbon');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const parts = ['p1','p2','p3','p4'];
    parts.forEach((id, idx)=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.style.transition = 'stroke-dashoffset 900ms linear ' + (idx*200) + 'ms';
      const len = el.getTotalLength();
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
      requestAnimationFrame(()=> { el.style.strokeDashoffset = '0'; });
      setTimeout(()=> { el.style.strokeDasharray = ''; el.style.strokeDashoffset = ''; }, 1500 + idx*200);
    });
  });
}
