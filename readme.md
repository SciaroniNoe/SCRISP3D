# SCRISP3D

SCRISP3D est une application web interactive développée dans le cadre du Master MDT pour le module Géoinformatique opérationnelle. L'application permet de visualiser, créer et gérer des tracés géographiques en utilisant les données topographiques officielles de SwissTopo.

## Ce projet a été développé par :
- **Sciaroni Noè**  
- **Rigolet Théo**  
- **Spoerri Nicolas**  

## Fonctionnalités
- Cartographie 2D/3D : Visualisation avec OpenLayers et intégration prévue pour le 3D (Cesium).
- Gestion des Tracés : Interface intuitive pour lister, sélectionner et analyser des itinéraires.
- Données Officielles : Intégration complète des services WMTS de SwissTopo.
- Interface Responsive : Sidebar escamotable (Menu Burger) permettant de maximiser l'espace de travail sur la carte.

## Technologies Utilisées
- Framework : Vue.js 3 (Composition API)
- Build Tool : Vite
- Gestion d'État : Pinia (pour la synchronisation globale des données)
- Cartographie : OpenLayers
- Styles : CSS3 & Bootstrap 5

## Installation et Lancement

### Prérequis
Assurez-vous d'avoir Node.js installé sur votre machine.
```sh
node -v
```

## 1. Clonage du projet
Déplacez-vous dans le dossier où vous souhaitez enregistrer le projet, puis exécutez la commande :  
```sh
git clone https://github.com/SciaroniNoe/SCRISP3D.git
```

### 2. Accéder au projet
Entrez dans le dossier du projet :
```sh
cd SCRISP3D
```

### 3. Installation des dépendances
Installez les bibliothèques nécessaires (contenues dans le fichier package.json) :
```sh
npm install
```

### 4. Lancement de l'application
Démarrez le serveur de développement local :
```sh
npm run dev
```
