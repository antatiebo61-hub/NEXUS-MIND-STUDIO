/* =========================================================================
   NEXUS MIND STUDIO — CONSTAT SINISTRE (démo terrain, très simple)
   Fonctions : photo, audio, GPS, horodatage, ID dossier, résumé
   Compatible Netlify (site statique) et Android (Chrome mobile, HTTPS requis
   pour l'accès caméra/micro/GPS).
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

/* ---------- Utilitaires ---------- */
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

/* ---------- Navigation entre étapes ---------- */
function allerEtape(n){
  if(n < 1 || n > NB_ETAPES) return;

  // Garde-fous simples : ne pas avancer sans avoir fait l'étape
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

/* ---------- ÉTAPE 1 : type de sinistre ---------- */
document.querySelectorAll('.choix-carte').forEach(carte=>{
  carte.addEventListener('click', ()=>{
    document.querySelectorAll('.choix-carte').forEach(c=>c.classList.remove('selectionne'));
    carte.classList.add('selectionne');
    dossier.typeSinistre = carte.dataset.valeur;
    setTimeout(()=>allerEtape(2), 250); // avance automatiquement, un choix = une action
  });
});

/* ---------- ÉTAPE 2 : photo ---------- */
const inputPhoto = document.getElementById('input-photo');
document.getElementById('btn-ouvrir-camera').addEventListener('click', ()=>inputPhoto.click());
document.getElementById('btn-reprendre-photo').addEventListener('click', ()=>inputPhoto.click());

inputPhoto.addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file){
    showToast('⚠ Aucune photo reçue — réessayez.');
    return;
  }

  // Méthode la plus simple et la plus fiable : on affiche directement le
  // fichier tel quel via une URL objet, sans conversion ni compression
  // (qui pouvaient bloquer sur certains téléphones).
  dossier.photoFile = file;
  dossier.photoDataUrl = URL.createObjectURL(file);

  document.getElementById('photo-vide').style.display = 'none';
  const img = document.getElementById('photo-apercu');
  img.src = dossier.photoDataUrl;
  img.style.display = 'block';
  document.getElementById('btn-ouvrir-camera').style.display = 'none';
  document.getElementById('btn-reprendre-photo').style.display = 'block';
  showToast('✓ Photo enregistrée.');
});

/* ---------- ÉTAPE 3 : audio ---------- */
document.getElementById('btn-enregistrer').addEventListener('click', demarrerEnregistrement);
document.getElementById('btn-arreter').addEventListener('click', arreterEnregistrement);
document.getElementById('btn-reecouter').addEventListener('click', ()=>{
  const lecteur = document.getElementById('lecteur-audio');
  lecteur.play();
});
document.getElementById('btn-reecouter-resume').addEventListener('click', ()=>{
  const lecteur = document.getElementById('lecteur-audio');
  lecteur.play();
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
      const lecteur = document.getElementById('lecteur-audio');
      lecteur.src = dossier.audioUrl;
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
    showToast('⚠ Micro refusé — autorisez l\'accès au microphone dans les paramètres du navigateur.');
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

/* ---------- ÉTAPE 4 : GPS ---------- */
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
    (err)=>{
      document.getElementById('icone-gps').textContent = '⚠️';
      document.getElementById('statut-gps').textContent = 'Localisation refusée ou indisponible.';
    },
    {enableHighAccuracy:true, timeout:10000}
  );
}

/* ---------- Branchement backend (optionnel — LocalStorage, rien codé en dur) ---------- */
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
  showToast(url ? '✓ Backend connecté : les prochains dossiers seront envoyés.' : '✓ Réglages effacés — mode démo local.');
});
document.getElementById('btn-effacer-backend').addEventListener('click', ()=>{
  localStorage.removeItem(CLE_URL);
  localStorage.removeItem(CLE_KEY);
  document.getElementById('input-backend-url').value = '';
  document.getElementById('input-backend-key').value = '';
});

/* Convertit une dataURL (photo) en Blob, pour l'envoi en multipart/form-data */
function dataUrlVersBlob(dataUrl){
  const [entete, base64] = dataUrl.split(',');
  const mime = entete.match(/:(.*?);/)[1];
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], {type:mime});
}

/* Envoie le dossier complet (photo + audio + métadonnées) vers le backend
   configuré, en multipart/form-data. N'a AUCUN effet si aucune URL n'est
   configurée — la démo continue de fonctionner exactement comme avant. */
async function envoyerVersBackend(){
  const url = getBackendUrl();
  if(!url) return {envoye:false, message:null}; // pas de backend configuré, rien à faire

  const form = new FormData();
  form.append('id', dossier.id);
  form.append('date_heure', dossier.dateHeure.toISOString());
  form.append('type_sinistre', dossier.typeSinistre || '');
  if(dossier.gps){
    form.append('gps_lat', dossier.gps.lat);
    form.append('gps_lon', dossier.gps.lon);
    form.append('gps_precision_m', dossier.gps.precision);
  }
  if(dossier.photoFile){
    form.append('photo', dossier.photoFile, `${dossier.id}_photo.jpg`);
  }
  if(dossier.audioBlob){
    form.append('audio', dossier.audioBlob, `${dossier.id}_audio.webm`);
  }

  const headers = {};
  const cle = getBackendKey();
  if(cle) headers['Authorization'] = `Bearer ${cle}`;

  try{
    const reponse = await fetch(url, {method:'POST', body:form, headers});
    if(reponse.ok){
      return {envoye:true, message:'✓ Dossier envoyé avec succès à votre backend.'};
    }
    return {envoye:false, message:`⚠ Le serveur a répondu une erreur (${reponse.status}). Le dossier reste en local.`};
  }catch(err){
    return {envoye:false, message:'⚠ Échec de connexion au backend (URL injoignable ou CORS). Le dossier reste en local.'};
  }
}

/* ---------- ÉTAPE 5 : résumé ---------- */
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
    ? '🔌 Backend connecté — ce dossier sera envoyé à la validation.'
    : '💾 Mode démo local (aucun backend connecté — voir ⚙️ en haut).';
}

document.getElementById('btn-valider').addEventListener('click', async ()=>{
  const btn = document.getElementById('btn-valider');
  const statutEl = document.getElementById('backend-statut');
  const backendConfigure = !!getBackendUrl();

  if(backendConfigure){
    btn.disabled = true;
    btn.textContent = '⏳ Envoi en cours...';
    statutEl.textContent = 'Connexion à votre backend...';
    statutEl.className = 'backend-statut';

    const resultat = await envoyerVersBackend();

    btn.disabled = false;
    btn.textContent = '📄 Valider et enregistrer le dossier';
    statutEl.textContent = resultat.message;
    statutEl.className = 'backend-statut ' + (resultat.envoye ? 'ok' : 'erreur');
    showToast(resultat.envoye ? '✓ Dossier envoyé : ' + dossier.id : '⚠ Envoi échoué — voir le détail à l\'écran.');
  }else{
    showToast('✓ Dossier enregistré (mode démo local) : ' + dossier.id);
  }
});

document.getElementById('btn-nouveau').addEventListener('click', ()=>{
  location.reload();
});

/* Initialisation : bouton précédent désactivé sur la 1ère étape */
document.getElementById('btn-precedent').disabled = true;
