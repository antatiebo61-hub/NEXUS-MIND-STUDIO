document.addEventListener("DOMContentLoaded", () => {


let cultureChoisie = "";
let texteVocal = "";
let positionGPS = "";



/* ELEMENTS */

const ecrans = document.querySelectorAll(".ecran");

const etapes = document.querySelectorAll(".etape");



function afficherEcran(numero){

    ecrans.forEach(e => {

        e.classList.add("cache");

    });


    document
    .getElementById("ecran-" + numero)
    .classList.remove("cache");


    etapes.forEach((e,index)=>{

        if(index < numero){

            e.classList.add("complete");

        }

    });

}



/* CULTURE */

document.querySelectorAll(".choix-carte")
.forEach(btn=>{


btn.addEventListener("click",()=>{


    document.querySelectorAll(".choix-carte")
    .forEach(b=>b.style.border="none");


    btn.style.border="3px solid #0878d4";


    cultureChoisie =
    btn.dataset.valeur;


});


});



document
.getElementById("continuer-culture")
.addEventListener("click",()=>{


if(cultureChoisie===""){

alert("Veuillez sélectionner une culture");

return;

}


document
.getElementById("resume-culture")
.textContent =
cultureChoisie;


afficherEcran(2);


});





/* PHOTO */

const photo =
document.getElementById("photo");


photo.addEventListener("change",function(){


const fichier=this.files[0];


if(fichier){


const lecteur =
new FileReader();


lecteur.onload=function(e){


document
.getElementById("image-apercu")
.src=e.target.result;


};


lecteur.readAsDataURL(fichier);


}



});



document
.getElementById("continuer-photo")
.addEventListener("click",()=>{


afficherEcran(3);


});





/* RECONNAISSANCE VOCALE */

const micro =
document.getElementById("micro");


const texte =
document.getElementById("texte-vocal");



let reconnaissance;



if(
'webkitSpeechRecognition' in window
){


reconnaissance =
new webkitSpeechRecognition();


reconnaissance.lang="fr-FR";

reconnaissance.continuous=false;


reconnaissance.onstart=()=>{


texte.innerHTML =
"🎙️ Écoute en cours...";


};



reconnaissance.onresult=(event)=>{


texteVocal =
event.results[0][0].transcript;


texte.innerHTML =
texteVocal;


};


reconnaissance.onerror=()=>{


texte.innerHTML =
"Erreur microphone";


};



}
else{


texte.innerHTML =
"Reconnaissance vocale non disponible";


}



micro.addEventListener("click",()=>{


if(reconnaissance){

reconnaissance.start();

}


});





document
.getElementById("continuer-audio")
.addEventListener("click",()=>{


afficherEcran(4);


});







/* GPS */

document
.getElementById("continuer-gps")
.addEventListener("click",()=>{


if(navigator.geolocation){



navigator.geolocation.getCurrentPosition(

(position)=>{


let lat =
position.coords.latitude.toFixed(6);


let lng =
position.coords.longitude.toFixed(6);



positionGPS =
lat+" / "+lng;



document
.getElementById("latitude")
.textContent=lat;



document
.getElementById("longitude")
.textContent=lng;



document
.getElementById("resume-gps")
.textContent=
positionGPS;



creerDossier();



afficherEcran(5);



},


()=>{


alert(
"Impossible d'obtenir la position GPS"
);


}

);



}

else{


alert(
"GPS non disponible"
);


}



});







/* CREATION DOSSIER */

function creerDossier(){


let date =
new Date();


let id =

"NM-" +

date.getFullYear()

+

"-"

+

Math.floor(
100000+
Math.random()*900000
);



document
.getElementById("id-dossier")
.textContent=id;


document
.getElementById("final-id")
.textContent=id;



let dateTexte =

date.toLocaleString("fr-FR");



document
.getElementById("date-heure")
.textContent=dateTexte;


document
.getElementById("final-date")
.textContent=dateTexte;



/* IA */

let diagnostic="";


if(cultureChoisie==="Arachide"){

diagnostic =
"Suspicion de stress hydrique ou attaque parasitaire.";

}

else if(cultureChoisie==="Mil"){

diagnostic =
"Analyse possible de déficit hydrique.";

}

else if(cultureChoisie==="Riz"){

diagnostic =
"Vérification recommandée du niveau d'humidité.";

}

else{

diagnostic =
"Analyse agronomique automatique terminée.";

}



document
.getElementById("diagnostic")
.textContent=
diagnostic;



document
.getElementById("message-ia")
.textContent=

"Votre déclaration concernant "
+
cultureChoisie
+
" a été analysée par Nexus IA. La preuve numérique est prête.";


}





/* EXPORT PDF DEMO */

document
.getElementById("telecharger")
.addEventListener("click",()=>{


alert(
"Rapport numérique généré : dossier sécurisé Nexus-AI"
);


});





/* NOUVEAU DOSSIER */

document
.getElementById("nouveau")
.addEventListener("click",()=>{


location.reload();


});



});