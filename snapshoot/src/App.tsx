import React, { useEffect, useState } from "react";
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  setupIonicReact,
  IonSpinner,
  IonLoading,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router";
import {
  camera,
  image,
  settings,
  chatbubble,
  search,
  people,
  imagesOutline,
  cameraOutline,
} from "ionicons/icons";
import { isAuthenticated } from "./services/auth.service";
import { AuthProvider } from "./contexts/AuthContext";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";

/* Pages */
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import Search from "./pages/Search";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Conversation from "./pages/Conversation";
import EditProfile from "./pages/EditProfile";
import PhotoView from "./pages/PhotoView";
import UserProfile from "./pages/UserProfile";

/* Custom CSS */
import "./App.css";

setupIonicReact();

// Protected Route component
const ProtectedRoute: React.FC<{
  component: React.ComponentType<any>;
  exact?: boolean;
  path: string;
}> = ({ component: Component, ...rest }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authed = await isAuthenticated();
        setIsAuthed(authed);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthed(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return <IonLoading isOpen={true} message={"Please wait..."} />;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthed ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{ pathname: "/login", state: { from: props.location } }}
          />
        )
      }
    />
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <IonApp>
        <IonReactRouter>
          <Route path="/login" component={Login} exact />
          <Route path="/register" component={Register} exact />

          <Route path="/app">
            <IonTabs>
              <IonRouterOutlet>
                <ProtectedRoute path="/app/home" component={Home} exact />
                <ProtectedRoute path="/app/profile" component={Profile} exact />
                <ProtectedRoute path="/app/search" component={Search} exact />
                <ProtectedRoute path="/app/chat" component={Chat} exact />
                <ProtectedRoute
                  path="/app/settings"
                  component={Settings}
                  exact
                />
                <ProtectedRoute
                  path="/app/conversation/:id"
                  component={Conversation}
                  exact
                />
                <ProtectedRoute
                  path="/app/edit-profile"
                  component={EditProfile}
                  exact
                />
                <ProtectedRoute
                  path="/app/photo/:id"
                  component={PhotoView}
                  exact
                />
                <ProtectedRoute
                  path="/app/user/:id"
                  component={UserProfile}
                  exact
                />
                <Route exact path="/app">
                  <Redirect to="/app/home" />
                </Route>
              </IonRouterOutlet>

              <IonTabBar slot="bottom" className="app-tab-bar">
                <IonTabButton tab="home" href="/app/home">
                  <IonIcon aria-hidden="true" icon={people} />
                  <IonLabel>Acceuil</IonLabel>
                </IonTabButton>
                <IonTabButton tab="gallery" href="/app/gallery">
                  <IonIcon icon={imagesOutline} />
                  <IonLabel>Galerie</IonLabel>
                </IonTabButton>
                <IonTabButton tab="camera" href="/app/camera">
                  <IonIcon icon={cameraOutline} />
                  <IonLabel>Caméra</IonLabel>
                </IonTabButton>
                <IonTabButton tab="chat" href="/app/chat">
                  <IonIcon aria-hidden="true" icon={chatbubble} />
                  <IonLabel>Chat</IonLabel>
                </IonTabButton>
                <IonTabButton tab="profile" href="/app/profile">
                  <IonIcon aria-hidden="true" icon={image} />
                  <IonLabel>Profile</IonLabel>
                </IonTabButton>
              </IonTabBar>
            </IonTabs>
          </Route>

          <Route exact path="/">
            <Redirect to="/app/home" />
          </Route>
        </IonReactRouter>
      </IonApp>
    </AuthProvider>
  );
};

export default App;
