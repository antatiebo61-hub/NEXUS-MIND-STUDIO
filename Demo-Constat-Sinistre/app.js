<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CNAAS - Constat Sinistre</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <div class="app">
    
    <!-- BARRE DU HAUT -->
    <header class="topbar">
      <div class="titre-bloc">
        <div class="brand">CNAAS</div>
        <div class="souscription">Constat de Sinistre Agricole</div>
      </div>
      <button class="btn-reglages" id="btn-reglages" title="Réglages">⚙️</button>
    </header>

    <!-- ÉTAPES (INDICATEUR) -->
    <div class="progression" id="barre-progression">
      <div class="etape-point active" data-etape="1"></div>
      <div class="etape-point" data-etape="2"></div>
      <div class="etape-point" data-etape="3"></div>
      <div class="etape-point" data-etape="4"></div>
      <div class="etape-point" data-etape="5"></div>
    </div>

    <!-- ÉCRAN 1 : TYPE DE SINISTRE -->
    <section class="ecran" id="ecran-1">
      <h2 class="question">Quel est le type de culture ou sinistre concerné ?<br><small>Touchez une option</small></h2>
      <div class="choix-grille">
        <button class="choix-carte" data-valeur="Arachide">
          <span class="choix-icone">🥜</span>
          <span class="choix-texte">Arachide</span>
        </button>
        <button class="choix-carte" data-valeur="Riz">
          <span class="choix-icone">🌾</span>
          <span class="choix-texte">Riz<small>Ceeb</small></span>
        </button>
        <button class="choix-carte" data-valeur="Maïs">
          <span class="choix-icone">🌽</span>
          <span class="choix-texte">Maïs</span>
        </button>
        <button class="choix-carte" data-valeur="Mil / Sorgho">
          <span class="choix-icone">🌿</span>
          <span class="choix-texte">Mil / Sorgho</span>
        </button>
        <button class="choix-carte" data-valeur="Niéné">
          <span class="choix-icone">🫘</span>
          <span class="choix-texte">Niébé</span>
        </button>
        <button class="choix-carte" data-valeur="Autre / Bétail">
          <span class="choix-icone">🐄</span>
          <span class="choix-texte">Autre / Bétail</span>
        </button>
      </div>
    </section>

    <!-- ÉCRAN 2 : PHOTO -->
    <section class="ecran" id="ecran-2" style="display:none;">
      <h2 class="question">Prenez une photo de la parcelle endommagée</h2>
      <div class="zone-capture" id="zone-photo">
        <div id="photo-vide" class="capture-vide">
          <div class="gros-icone">📷</div>
          <div class="capture-label">Aucune photo</div>
        </div>
        <img id="photo-apercu" class="photo-apercu" style="display:none;" alt="Aperçu photo">
      </div>
      <input type="file" id="input-photo" accept="image/*" capture="environment" style="display:none;">
      <button class="bouton-principal" id="btn-ouvrir-camera">Ouvrir l'appareil photo</button>
      <button class="bouton-secondaire" id="btn-reprendre-photo" style="display:none;">Reprendre la photo</button>
    </section>

    <!-- ÉCRAN 3 : AUDIO -->
    <section class="ecran" id="ecran-3" style="display:none;">
      <h2 class="question">Expliquez les dégâts en vocaux<br><small>Enregistrez une description claire</small></h2>
      <div class="zone-capture">
        <div class="gros-icone" id="icone-micro">🎙️</div>
        <div class="capture-label" id="statut-audio">Prêt à enregistrer</div>
        <div class="chrono" id="chrono-audio" style="display:none;">00:00</div>
        <audio id="lecteur-audio" controls style="width:100%; margin-top:10px; display:none;"></audio>
      </div>
      <button class="bouton-danger" id="btn-enregistrer">🔴 Démarrer l'enregistrement</button>
      <button class="bouton-principal" id="btn-arreter" style="display:none;">Arrêter l'enregistrement</button>
      <button class="bouton-secondaire" id="btn-reecouter" style="display:none;">▶ Réécouter le vocal</button>
    </section>

    <!-- ÉCRAN 4 : GPS -->
    <section class="ecran" id="ecran-4" style="display:none;">
      <h2 class="question">Localisation de la parcelle</h2>
      <div class="zone-capture">
        <div class="gros-icone" id="icone-gps">📍</div>
        <div class="capture-label" id="statut-gps">Recherche du signal GPS...</div>
        <div class="gps-coords" id="gps-coords"></div>
      </div>
      <button class="bouton-secondaire" id="btn-refaire-gps">Actualiser la position GPS</button>
    </section>

    <!-- ÉCRAN 5 : RÉSUMÉ -->
    <section class="ecran" id="ecran-5" style="display:none;">
      <h2 class="question">Résumé du Constat</h2>
      
      <div class="preuve-badge" id="backend-statut">Mode démo local</div>

      <img id="resume-photo-apercu" class="photo-resume" style="display:none;" alt="Photo sinistre">

      <div class="fiche-resume">
        <div class="fiche-ligne">
          <span class="fiche-cle">N° de Dossier</span>
          <span class="fiche-val" id="resume-id">—</span>
        </div>
        <div class="fiche-ligne">
          <span class="fiche-cle">Date et Heure</span>
          <span class="fiche-val" id="resume-date">—</span>
        </div>
        <div class="fiche-ligne">
          <span class="fiche-cle">Type / Culture</span>
          <span class="fiche-val" id="resume-type">—</span>
        </div>
        <div class="fiche-ligne">
          <span class="fiche-cle">Position GPS</span>
          <span class="fiche-val" id="resume-gps">—</span>
        </div>
      </div>

      <button class="bouton-secondaire" id="btn-reecouter-resume">🔊 Écouter la déclaration vocale</button>
      <button class="bouton-principal bouton-valider" id="btn-valider">✓ Valider et enregistrer le dossier</button>
      <button class="bouton-secondaire" id="btn-nouveau">＋ Faire un autre constat</button>
    </section>

    <!-- NAVIGATION BASSE -->
    <nav class="nav-bas">
      <button clSass="nav-btn" id="btn-precedent">◀ Précédent</button>
      <button class="nav-btn nav-btn-principal" id="btn-suivant">Suivant ▶</button>
    </nav>

  </div>

  <!-- TOAST DE NOTIFICATION -->
  <div class="toast" id="toast"></div>

  <!-- MODALE RÉGLAGES BACKEND -->
  <div class="modale-fond" id="modale-reglages" style="display:none;">
    <div class="modale">
      <div class="modale-titre">Configuration Backend</div>
      <div class="modale-texte">Connectez l'application à votre serveur distant pour envoyer les données en temps réel. Laissez vide pour rester en mode local.</div>
      
      <label class="modale-label" for="input-backend-url">URL du Serveur API</label>
      <input type="text" class="modale-input" id="input-backend-url" placeholder="https://votre-serveur.com/api/constats">

      <label class="modale-label" for="input-backend-key">Clé Secrète / Token</label>
      <input type="password" class="modale-input" id="input-backend-key" placeholder="clé_api_secret">

      <div class="modale-boutons">
        <button class="bouton-secondaire" id="btn-effacer-backend">Effacer</button>
        <button class="bouton-principal" id="btn-sauver-backend">Enregistrer</button>
      </div>
      <button class="modale-fermer" id="btn-fermer-reglages">Fermer</button>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
