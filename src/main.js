import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/style.css'

// On crée l'application Vue
const app = createApp(App)

// On active Pinia pour la gestion des tracés
app.use(createPinia())

app.mount('#app')