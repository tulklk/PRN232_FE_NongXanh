// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
	apiKey: "AIzaSyARVKRb_8oI94qCS2cV9eZLhdxL5WqHMSI",
	authDomain: "prn232-958id.firebaseapp.com",
	projectId: "prn232-958id",
	storageBucket: "prn232-958id.firebasestorage.app",
	messagingSenderId: "81122242359",
	appId: "1:81122242359:web:2fb5265d545f49760d258a",
	measurementId: "G-ZDMYE0LVQ5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;