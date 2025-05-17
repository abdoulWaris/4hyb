import React from "react";
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonText } from "@ionic/react";

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>BeUnreal</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding ion-text-center">
        <img
          src="welcome_beunreal.jpg"
          alt="Bienvenue sur BeUnreal"
          style={{ maxWidth: "50%", height: "auto", margin: "2rem auto" }}
        />
        <IonText>
          <h2>Bienvenue sur BeUnreal</h2>
          <p>Commencez à partager vos moments incroyables !</p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Home;
