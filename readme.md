# SCRISP3D

SCRISP3D est une application web de Système d'Information Géographique (SIG) interactive développée dans le cadre du Master MDT. L'application permet de visualiser, créer et gérer des tracés géographiques en utilisant les données topographiques officielles de swisstopo.

## Fonctionnalités
- Cartographie 2D/3D : Visualisation haute performance avec OpenLayers et intégration prévue pour le 3D (Cesium/SwissTerrain).
- Gestion des Tracés : Interface intuitive pour lister, sélectionner et analyser des itinéraires.
- Données Officielles : Intégration complète des services WMTS de swisstopo (Système de coordonnées MN95).
- Interface Responsive : Sidebar escamotable (Menu Burger) permettant de maximiser l'espace de travail sur la carte.

## Technologies Utilisées
- Framework : Vue.js 3 (Composition API)
- Build Tool : Vite
- Gestion d'État : Pinia (pour la synchronisation globale des données)
- Cartographie : OpenLayers
- Styles : CSS3 & Bootstrap 5

## Installation et Lancement

### Prérequis
Assurez-vous d'avoir Node.js (version 18 ou supérieure) installé sur votre machine.

### 1. Préparation du projet
Entrez dans le dossier du projet :
```sh
cd SCRISP3D
```

### 2. Installation des dépendances
Installez les bibliothèques nécessaires (Vue, Pinia, OpenLayers, Bootstrap) :
```sh
npm install
```

### 3. Lancement de l'application
Démarrez le serveur de développement local :
```sh
npm run dev
```
