/* =========================================================================
   NEXUS MIND STUDIO — CONSTAT SINISTRE (démo terrain, très simple)
   ========================================================================= */

const dossier = {
  id: null,
  typeSinistre: null,
  dateHeure: null,
  gps: null,
  photoDataUrl: null,
  audioBlob: null,
  audioUrl: null,
};

let etapeActuelle = 1;
const NB_ETAPES = 5;
let mediaRecorder = null;
let audioChunks = [];
let chronoInterval = null;
let chronoSecondes = 0;

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}

function genererIdDossier(){
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const rand = Math.floor(1000 + Math.random()*9000);
  return `CNAAS-${yy}${mm}${dd}-${rand}`;
}

function formatDateHeure(date){
  const jours = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const j = jours[date.getDay()];
  const dd = String(date.getDate()).padStart(2,'0');
  const mm = String(date.getMonth()+1).padStart(2,'0');
  const yy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2,'0');
  const mi = String(date.getMinutes()).padStart(2,'0');
  return `${j} ${dd}/${mm}/${yy} à ${hh}h${mi}`;
}

function allerEtape(n){
  if(n < 1 || n > NB_ETAPES) return;

  if(n > etapeActuelle){
    if(etapeActuelle===1 && !dossier.typeSinistre){
      showToast('⚠ Choisissez le type de sinistre avant de continuer.');
      return;
    }
    if(etapeActuelle===2 && !dossier.photoDataUrl){
      showToast('⚠ Prenez une photo avant de continuer.');
      return;
    }
    if(etapeActuelle===3 && !dossier.audioBlob){
      showToast('⚠ Enregistrez votre déclaration vocale avant de continuer.');
      return;
    }
  }

  document.getElementById(`ecran-${etapeActuelle}`).style.display = 'none';
  etapeActuelle = n;
  document.getElementById(`ecran-${etapeActuelle}`).style.display = 'flex';

  document.querySelectorAll('.etape-point').forEach(p=>{
    const pe = parseInt(p.dataset.etape);
    p.classList.toggle('active', pe===etapeActuelle);
    p.classList.toggle('complete', pe<etapeActuelle);
  });

  document.getElementById('btn-precedent').disabled = (etapeActuelle===1);
  const btnSuivant = document.getElementById('btn-suivant');
  if(etapeActuelle===NB_ETAPES){
    btnSuivant.style.visibility='hidden';
  }else{
    btnSuivant.style.visibility='visible';
    btnSuivant.textContent = etapeActuelle===4 ? 'Voir le résumé ▶' : 'Suivant ▶';
  }

  if(etapeActuelle===4 && !dossier.gps) demarrerGPS();
  if(etapeActuelle===5) remplirResume();
}

document.getElementById('btn-precedent').addEventListener('click', ()=>allerEtape(etapeActuelle-1));
document.getElementById('btn-suivant').addEventListener('click', ()=>allerEtape(etapeActuelle+1));

document.querySelectorAll('.choix-carte').forEach(carte=>{
  carte.addEventListener('click', ()=>{
    document.querySelectorAll('.choix-carte').forEach(c=>c.classList.remove('selectionne'));
    carte.classList.add('selectionne');
    dossier.typeSinistre = carte.dataset.valeur;
    setTimeout(()=>allerEtape(2), 250);
  });
});

const inputPhoto = document.getElementById('input-photo');
document.getElementById('btn-ouvrir-camera').addEventListener('click', ()=>inputPhoto.click());
document.getElementById('btn-reprendre-photo').addEventListener('click', ()=>inputPhoto.click());

inputPhoto.addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;

  document.getElementById('photo-vide').style.display = 'flex';
  document.getElementById('photo-vide').innerHTML = `
    <div class="gros-icone">⏳</div>
    <div class="capture-label">Traitement de la photo...</div>`;
  document.getElementById('photo-apercu').style.display = 'none';

  const imgTemp = new Image();
  const urlTemp = URL.createObjectURL(file);

  imgTemp.onload = ()=>{
    try{
      const MAX_LARGEUR = 1280;
      let {width, height} = imgTemp;
      if(width > MAX_LARGEUR){
        height = Math.round(height * (MAX_LARGEUR/width));
        width = MAX_LARGEUR;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgTemp, 0, 0, width, height);
      dossier.photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(urlTemp);

      document.getElementById('photo-vide').style.display = 'none';
      const img = document.getElementById('photo-apercu');
      img.src = dossier.photoDataUrl;
      img.style.display = 'block';
      document.getElementById('btn-ouvrir-camera').style.display = 'none';
      document.getElementById('btn-reprendre-photo').style.display = 'block';
      showToast('✓ Photo enregistrée.');
    }catch(err){
      URL.revokeObjectURL(urlTemp);
      afficherErreurPhoto();
    }
  };

  imgTemp.onerror = ()=>{
    URL.revokeObjectURL(urlTemp);
    afficherErreurPhoto();
  };

  imgTemp.src = urlTemp;
});

function afficherErreurPhoto(){
  document.getElementById('photo-vide').innerHTML = `
    <div class="gros-icone">📷</div>
    <div class="capture-label">Prendre une photo</div>`;
  showToast('⚠ La photo n\'a pas pu être chargée. Réessayez.');
}

document.getElementById('btn-enregistrer').addEventListener('click', demarrerEnregistrement);
document.getElementById('btn-arreter').addEventListener('click', arreterEnregistrement);
document.getElementById('btn-reecouter').addEventListener('click', ()=>{
  document.getElementById('lecteur-audio').play();
});
document.getElementById('btn-reecouter-resume').addEventListener('click', ()=>{
  document.getElementById('lecteur-audio').play();
});

async function demarrerEnregistrement(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = (e)=>{ if(e.data.size>0) audioChunks.push(e.data); };
    mediaRecorder.onstop = ()=>{
      dossier.audioBlob = new Blob(audioChunks, {type:'audio/webm'});
      dossier.audioUrl = URL.createObjectURL(dossier.audioBlob);
      document.getElementById('lecteur-audio').src = dossier.audioUrl;
      stream.getTracks().forEach(t=>t.stop());
    };
    mediaRecorder.start();

    document.getElementById('icone-micro').textContent = '🔴';
    document.getElementById('statut-audio').textContent = 'Enregistrement en cours...';
    document.getElementById('chrono-audio').style.display = 'block';
    document.getElementById('btn-enregistrer').style.display = 'none';
    document.getElementById('btn-arreter').style.display = 'block';
    document.getElementById('btn-reecouter').style.display = 'none';

    chronoSecondes = 0;
    document.getElementById('chrono-audio').textContent = '00:00';
    chronoInterval = setInterval(()=>{
      chronoSecondes++;
      const m = String(Math.floor(chronoSecondes/60)).padStart(2,'0');
      const s = String(chronoSecondes%60).padStart(2,'0');
      document.getElementById('chrono-audio').textContent = `${m}:${s}`;
    }, 1000);

  }catch(err){
    showToast('⚠ Micro refusé — autorisez l\'accès au microphone.');
  }
}

function arreterEnregistrement(){
  if(mediaRecorder && mediaRecorder.state !== 'inactive'){
    mediaRecorder.stop();
  }
  clearInterval(chronoInterval);

  document.getElementById('icone-micro').textContent = '✅';
  document.getElementById('statut-audio').textContent = 'Déclaration enregistrée';
  document.getElementById('btn-arreter').style.display = 'none';
  document.getElementById('btn-reecouter').style.display = 'block';
  showToast('✓ Déclaration vocale enregistrée.');
}

document.getElementById('btn-refaire-gps').addEventListener('click', demarrerGPS);

function demarrerGPS(){
  document.getElementById('icone-gps').textContent = '📍';
  document.getElementById('statut-gps').textContent = 'Recherche du signal GPS...';
  document.getElementById('gps-coords').textContent = '';

  if(!navigator.geolocation){
    document.getElementById('statut-gps').textContent = 'GPS non disponible sur cet appareil.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      dossier.gps = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        precision: pos.coords.accuracy
      };
      document.getElementById('icone-gps').textContent = '✅';
      document.getElementById('statut-gps').textContent = 'Position enregistrée';
      document.getElementById('gps-coords').textContent =
        `${dossier.gps.lat.toFixed(4)}° N, ${dossier.gps.lon.toFixed(4)}° W · précision ±${Math.round(dossier.gps.precision)}m`;
    },
    ()=>{
      document.getElementById('icone-gps').textContent = '⚠️';
      document.getElementById('statut-gps').textContent = 'Localisation refusée ou indisponible.';
    },
    {enableHighAccuracy:true, timeout:10000}
  );
}

const CLE_URL = 'nms_constat_backend_url';
const CLE_KEY = 'nms_constat_backend_key';

function getBackendUrl(){ return localStorage.getItem(CLE_URL) || ''; }
function getBackendKey(){ return localStorage.getItem(CLE_KEY) || ''; }

const modaleReglages = document.getElementById('modale-reglages');
document.getElementById('btn-reglages').addEventListener('click', ()=>{
  document.getElementById('input-backend-url').value = getBackendUrl();
  document.getElementById('input-backend-key').value = getBackendKey();
  modaleReglages.style.display = 'flex';
});
document.getElementById('btn-fermer-reglages').addEventListener('click', ()=>{
  modaleReglages.style.display = 'none';
});
document.getElementById('btn-sauver-backend').addEventListener('click', ()=>{
  const url = document.getElementById('input-backend-url').value.trim();
  const key = document.getElementById('input-backend-key').value.trim();
  if(url) localStorage.setItem(CLE_URL, url); else localStorage.removeItem(CLE_URL);
  if(key) localStorage.setItem(CLE_KEY, key); else localStorage.removeItem(CLE_KEY);
  modaleReglages.style.display = 'none';
  showToast(url ? '✓ Backend connecté.' : '✓ Mode démo local.');
});
document.getElementById('btn-effacer-backend').addEventListener('click', ()=>{
  localStorage.removeItem(CLE_URL);
  localStorage.removeItem(CLE_KEY);
  document.getElementById('input-backend-url').value = '';
  document.getElementById('input-backend-key').value = '';
});

function remplirResume(){
  if(!dossier.id){
    dossier.id = genererIdDossier();
    dossier.dateHeure = new Date();
  }
  document.getElementById('resume-id').textContent = dossier.id;
  document.getElementById('resume-date').textContent = formatDateHeure(dossier.dateHeure);
  document.getElementById('resume-type').textContent = dossier.typeSinistre || '—';
  document.getElementById('resume-gps').textContent = dossier.gps
    ? `${dossier.gps.lat.toFixed(4)}° N, ${dossier.gps.lon.toFixed(4)}° W`
    : 'Non disponible';

  const apercu = document.getElementById('resume-photo-apercu');
  if(dossier.photoDataUrl){
    apercu.src = dossier.photoDataUrl;
    apercu.style.display = 'block';
  }

  const statutEl = document.getElementById('backend-statut');
  statutEl.className = 'backend-statut';
  statutEl.textContent = getBackendUrl()
    ? '🔌 Backend connecté — ce dossier sera envoyé.'
    : '💾 Mode démo local.';
}

document.getElementById('btn-valider').addEventListener('click', ()=>{
  showToast('✓ Dossier enregistré avec succès : ' + dossier.id);
});

document.getElementById('btn-nouveau').addEventListener('click', ()=>{
  location.reload();
});

document.getElementById('btn-precedent').disabled = true;
```[cite: 1]
