import Firebase from 'firebase/app'
import 'firebase/firestore'

const firebaseApp = Firebase.initializeApp({
  apiKey: 'AIzaSyCdF0zX81MHnA9nUv44AZMY7z7Za0c5MCI',
  authDomain: 'games-ff915.firebaseapp.com',
  databaseURL: 'https://games-ff915.firebaseio.com',
  projectId: 'games-ff915',
  storageBucket: '',
  messagingSenderId: '308063716684',
  appId: '1:308063716684:web:f02f93626362a544',
})

const firestore = firebaseApp.firestore()

export { firestore }
