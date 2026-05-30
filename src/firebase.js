import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDKRoln0ojxjNkDoqDhQCHPEQpW3CNdb5s",
  authDomain: "omniworxdb.firebaseapp.com",
  projectId: "omniworxdb",
  storageBucket: "omniworxdb.firebasestorage.app",
  messagingSenderId: "1050089640784",
  appId: "1:1050089640784:web:bb421d3e05b76072ad5255"
}

const app = initializeApp(firebaseConfig)

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
})
