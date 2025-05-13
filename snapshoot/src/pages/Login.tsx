import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonPage,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  IonLoading,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  useIonRouter,
} from "@ionic/react";
import { logIn, logoInstagram } from "ionicons/icons";
import { login, isAuthenticated } from "../services/auth.service";
import "./Login.css";

const Login: React.FC = () => {
  const router = useIonRouter();
  const [emailOrUsername, setEmailOrUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsChecking(true);
        const isAuthed = await isAuthenticated();

        if (isAuthed) {
          router.push("/home", "root", "replace");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = async () => {
    try {
      // Validate inputs
      if (!emailOrUsername || !password) {
        setErrorMessage("Please fill all fields");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      // Try to login
      await login(emailOrUsername, password);

      // Redirect to home on success
      router.push("/home", "root", "replace");
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonLoading isOpen={true} message={"Checking login status..."} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="login-page">
      <IonContent fullscreen className="ion-padding">
        <IonGrid className="login-container">
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" size-md="8" size-lg="6" className="ion-text-center">
              <div className="logo-container">
                <IonIcon icon={logoInstagram} className="logo-icon" />
                <h1 className="app-name">BeUnreal</h1>
              </div>

              <div className="form-container">
                <IonItem className="form-item">
                  <IonLabel position="floating">Email or Username</IonLabel>
                  <IonInput
                    value={emailOrUsername}
                    onIonChange={(e) => setEmailOrUsername(e.detail.value!)}
                    type="text"
                    autocapitalize="off"
                  />
                </IonItem>

                <IonItem className="form-item">
                  <IonLabel position="floating">Password</IonLabel>
                  <IonInput value={password} onIonChange={(e) => setPassword(e.detail.value!)} type="password" />
                </IonItem>

                {errorMessage && (
                  <IonText color="danger" className="error-message">
                    <p>{errorMessage}</p>
                  </IonText>
                )}

                <IonButton expand="block" className="login-button" onClick={handleLogin} disabled={isLoading}>
                  <IonIcon slot="start" icon={logIn} />
                  Login
                </IonButton>

                <div className="separator">
                  <div className="line"></div>
                  <div className="or">OR</div>
                  <div className="line"></div>
                </div>

                <IonButton
                  expand="block"
                  fill="outline"
                  className="register-button"
                  routerLink="/register"
                  disabled={isLoading}
                >
                  Create New Account
                </IonButton>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonLoading isOpen={isLoading} message={"Logging in..."} />
      </IonContent>
    </IonPage>
  );
};

export default Login;
