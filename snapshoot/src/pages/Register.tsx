import React, { useState } from "react";
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
  IonToolbar,
  IonButtons,
  IonBackButton,
  useIonRouter,
} from "@ionic/react";
import { personAdd, arrowBack, logoInstagram } from "ionicons/icons";
import { register } from "../services/auth.service";
import "./Register.css";

const Register: React.FC = () => {
  const router = useIonRouter();
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    // Username should be 3-20 characters, alphanumeric, underscores and dots
    const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;
    return usernameRegex.test(username);
  };

  const validatePassword = (password: string): boolean => {
    // Password should be at least 6 characters
    return password.length >= 6;
  };

  const handleRegister = async () => {
    try {
      // Validate inputs
      if (!email || !username || !password || !confirmPassword) {
        setErrorMessage("Please fill all fields");
        return;
      }

      if (!validateEmail(email)) {
        setErrorMessage("Please enter a valid email");
        return;
      }

      if (!validateUsername(username)) {
        setErrorMessage("Username must be 3-20 characters and can only contain letters, numbers, underscores and dots");
        return;
      }

      if (!validatePassword(password)) {
        setErrorMessage("Password must be at least 6 characters");
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      // Try to register
      await register(email, username, password);

      // Redirect to home on success
      router.push("/home", "root", "replace");
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to register. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage className="register-page">
      <IonToolbar color="transparent" className="register-toolbar">
        <IonButtons slot="start">
          <IonBackButton defaultHref="/login" icon={arrowBack} text="" />
        </IonButtons>
      </IonToolbar>

      <IonContent fullscreen className="ion-padding">
        <IonGrid className="register-container">
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" size-md="8" size-lg="6" className="ion-text-center">
              <div className="logo-container">
                <IonIcon icon={logoInstagram} className="logo-icon" />
                <h1 className="app-name">BeUnreal</h1>
                <p className="tagline">Create your account and start sharing moments</p>
              </div>

              <div className="form-container">
                <IonItem className="form-item">
                  <IonLabel position="floating">Email</IonLabel>
                  <IonInput
                    value={email}
                    onIonChange={(e) => setEmail(e.detail.value!)}
                    type="email"
                    autocapitalize="off"
                  />
                </IonItem>

                <IonItem className="form-item">
                  <IonLabel position="floating">Username</IonLabel>
                  <IonInput
                    value={username}
                    onIonChange={(e) => setUsername(e.detail.value!)}
                    type="text"
                    autocapitalize="off"
                  />
                </IonItem>

                <IonItem className="form-item">
                  <IonLabel position="floating">Password</IonLabel>
                  <IonInput value={password} onIonChange={(e) => setPassword(e.detail.value!)} type="password" />
                </IonItem>

                <IonItem className="form-item">
                  <IonLabel position="floating">Confirm Password</IonLabel>
                  <IonInput
                    value={confirmPassword}
                    onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                    type="password"
                  />
                </IonItem>

                {errorMessage && (
                  <IonText color="danger" className="error-message">
                    <p>{errorMessage}</p>
                  </IonText>
                )}

                <IonButton expand="block" className="register-button" onClick={handleRegister} disabled={isLoading}>
                  <IonIcon slot="start" icon={personAdd} />
                  Create Account
                </IonButton>

                <div className="login-link">
                  <IonText color="medium">
                    Already have an account?{" "}
                    <IonText color="primary" className="login-text" onClick={() => router.push("/login")}>
                      Login
                    </IonText>
                  </IonText>
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonLoading isOpen={isLoading} message={"Creating account..."} />
      </IonContent>
    </IonPage>
  );
};

export default Register;
