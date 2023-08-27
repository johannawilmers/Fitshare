import { useEffect, useRef, useState } from "react";

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/compat/analytics";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Main from "../Main";
import Interest from "./Interest";
import "../style/LoginPage.css";
import { Group } from "../components/Group";
import NewPost from "./NewPost";
import NewAd from "./NewAd";
import AdLoginPage from "./AdLoginPage";

firebase.initializeApp({
  apiKey: "AIzaSyB1JcAfuFsMNrv1TGzf0-7axx_rQVASozI",
  authDomain: "fitshare-7b3ca.firebaseapp.com",
  projectId: "fitshare-7b3ca",
  storageBucket: "fitshare-7b3ca.appspot.com",
  messagingSenderId: "222541018982",
  appId: "1:222541018982:web:ed562b6036efd9e0197aa7",
  measurementId: "G-L40G2SPHC7",
});

const auth: firebase.auth.Auth = firebase.auth();
const firestore: firebase.firestore.Firestore = firebase.firestore();
const analytics: firebase.analytics.Analytics = firebase.analytics();

const LoginPage: React.FC = () => {
  const [user] = useAuthState(auth as any);
  const [interest, setInterest] = useState(0);

  const [isAdvertiser, setIsAdvertiser] = useState(false);

  // check if the current user exists in Firestore
  const checkUserExists = async () => {
    const usersCollection = firestore.collection("users");
    const currentUserDoc = usersCollection.doc(user!.uid);
    const currentUserSnapshot = await currentUserDoc.get();

    const currentUserInterest = currentUserSnapshot.data()?.interest || 0;
    setInterest(currentUserInterest);

    if (!currentUserSnapshot.exists) {

      // current user does not exist, create a new user document
      const userData = {
        id: user!.uid,
        displayName: user!.displayName,
        photoURL: user!.photoURL,
        friends: [],
        programs: [],
        posts: [],
        groups: [],
        interest: [],
        streakCount: 0,
      };
      await currentUserDoc.set(userData);


    } else {
      // current user exists, check if they have logged today
      onUserLogin(user as firebase.User);
    }
  };

  useEffect(() => {
    if (user) {
      checkUserExists();
    }
  }, [user]);


  const onUserLogin = (async (user: firebase.User) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const userId = user.uid;

    const executions = await firebase.firestore().collection('execution').where('owner', '==', userId).get();

    let hasLoggedToday = false;
    let hasLoggedYesterday = false;
    executions.forEach((executionDoc) => {
      const execution = executionDoc.data();
      const executionDate = execution.date.toDate();
      if (executionDate.toDateString() === today.toDateString()) {
        hasLoggedToday = true;
      }
      else if (executionDate.toDateString() === yesterday.toDateString()) {
        hasLoggedYesterday = true;
      }
    });

    if (!hasLoggedToday && !hasLoggedYesterday) {
      await firebase.firestore().collection('users').doc(userId).update({ streakCount: 0 });
    }
  });



  return (
    <div className="LoginPage">
      <section>{isAdvertiser ? <AdLoginPage handleBack={() => setIsAdvertiser(false)} /> : user ?
        (interest === 0 ? <Interest user={user as firebase.User} interest={interest} setInterest={setInterest} /> : <Main currentUser={user as firebase.User} />)
        : <SignIn setIsAdvertiser={setIsAdvertiser} />}</section>
    </div>
  );
};

function SignIn(props: { setIsAdvertiser: (isAdvertiser: boolean) => void }) {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };
  const goToAdvertiserPage = () => {
    props.setIsAdvertiser(true);
  };
  return (
    <div className="sign-in">
      <h1 className="header">FitShare</h1>
      <button className="Sign-in-button" onClick={signInWithGoogle}> Sign in with Google</button>
      <button className="Advertiser-sign-in-button" onClick={goToAdvertiserPage}>Sign in as advertiser</button>
    </div>
  );
}

export default LoginPage;
