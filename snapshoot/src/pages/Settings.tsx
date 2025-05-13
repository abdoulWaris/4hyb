import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonText,
  IonDatetime,
  IonModal,
  IonButton,
  IonIcon,
  IonItemDivider,
  IonAlert,
  IonCard,
  IonCardContent,
  IonNote,
  IonBadge,
  IonSpinner,
} from "@ionic/react";
import { notifications, trash, time, arrowBack } from "ionicons/icons";
import {
  getNotificationSettings,
  saveNotificationSettings,
  toggleNotifications,
  initNotifications,
  getPendingNotifications,
} from "../services/notification.service";
import { deleteAllPhotos } from "../services/storage.service";
import "./Settings.css";

const Settings: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [notificationTime, setNotificationTime] = useState<string>("12:00");
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [showClearDataAlert, setShowClearDataAlert] = useState<boolean>(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Load notification settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);

        // Initialize notifications
        await initNotifications();

        // Get notification settings
        const settings = await getNotificationSettings();
        setNotificationsEnabled(settings.enabled);

        if (settings.time) {
          setNotificationTime(settings.time);
        }

        // Get pending notifications count
        const pendingNotifications = await getPendingNotifications();
        setPendingCount(pendingNotifications.length);
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle toggle notifications
  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      await toggleNotifications(enabled, notificationTime);
      setNotificationsEnabled(enabled);

      // Get updated pending notifications count
      const pendingNotifications = await getPendingNotifications();
      setPendingCount(pendingNotifications.length);

      setAlertMessage(
        enabled ? `Notifications enabled at ${formatTimeDisplay(notificationTime)}` : "Notifications disabled"
      );
      setShowSuccessAlert(true);
    } catch (error) {
      console.error("Error toggling notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle time change
  const handleTimeChange = (ev: CustomEvent) => {
    const selectedDateTime = new Date(ev.detail.value);
    const hours = selectedDateTime.getHours().toString().padStart(2, "0");
    const minutes = selectedDateTime.getMinutes().toString().padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    setNotificationTime(timeString);
  };

  // Handle time save
  const handleSaveTime = async () => {
    try {
      setIsLoading(true);

      // Only update if notifications are enabled
      if (notificationsEnabled) {
        await toggleNotifications(true, notificationTime);
      } else {
        // Just save the time preference
        await saveNotificationSettings({
          enabled: false,
          time: notificationTime,
        });
      }

      // Get updated pending notifications count
      const pendingNotifications = await getPendingNotifications();
      setPendingCount(pendingNotifications.length);

      setShowTimePicker(false);
      setAlertMessage(`Notification time updated to ${formatTimeDisplay(notificationTime)}`);
      setShowSuccessAlert(true);
    } catch (error) {
      console.error("Error saving notification time:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clear all data
  const handleClearAllData = async () => {
    try {
      setIsLoading(true);

      // Delete all photos
      await deleteAllPhotos();

      // Disable notifications
      await toggleNotifications(false);
      setNotificationsEnabled(false);

      // Get updated pending notifications count
      const pendingNotifications = await getPendingNotifications();
      setPendingCount(pendingNotifications.length);

      setShowClearDataAlert(false);
      setAlertMessage("All data has been cleared successfully");
      setShowSuccessAlert(true);
    } catch (error) {
      console.error("Error clearing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time for display
  const formatTimeDisplay = (timeString: string) => {
    const [hoursStr, minutesStr] = timeString.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList>
          <IonItemDivider color="light">
            <IonLabel>Notifications</IonLabel>
          </IonItemDivider>

          <IonItem>
            <IonIcon icon={notifications} slot="start" color="primary"></IonIcon>
            <IonLabel>Daily Reminder</IonLabel>
            {isLoading ? (
              <IonSpinner name="dots" slot="end" />
            ) : (
              <IonToggle
                checked={notificationsEnabled}
                onIonChange={(e) => handleToggleNotifications(e.detail.checked)}
                slot="end"
              />
            )}
          </IonItem>

          <IonItem button detail onClick={() => setShowTimePicker(true)}>
            <IonIcon icon={time} slot="start" color="primary"></IonIcon>
            <IonLabel>Notification Time</IonLabel>
            <IonText slot="end" color="medium">
              {formatTimeDisplay(notificationTime)}
            </IonText>
          </IonItem>

          {notificationsEnabled && pendingCount > 0 && (
            <IonItem lines="none">
              <IonNote slot="start" style={{ opacity: 0 }}></IonNote>
              <IonNote color="success">
                Next notification scheduled
                <IonBadge color="success" className="notification-badge">
                  {pendingCount}
                </IonBadge>
              </IonNote>
            </IonItem>
          )}

          <IonItemDivider color="light">
            <IonLabel>Data Management</IonLabel>
          </IonItemDivider>

          <IonItem button onClick={() => setShowClearDataAlert(true)}>
            <IonIcon icon={trash} slot="start" color="danger"></IonIcon>
            <IonLabel color="danger">Clear All Data</IonLabel>
          </IonItem>

          <IonItemDivider color="light">
            <IonLabel>About</IonLabel>
          </IonItemDivider>

          <IonCard className="about-card">
            <IonCardContent>
              <h2>BeUnreal</h2>
              <p>Version 1.0.0</p>
              <p>A BeReal-inspired photo application built with Ionic React and Capacitor.</p>
              <p className="copyright">© 2025 Snapshoot</p>
            </IonCardContent>
          </IonCard>
        </IonList>

        {/* Time picker modal */}
        <IonModal isOpen={showTimePicker} onDidDismiss={() => setShowTimePicker(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonButton slot="start" fill="clear" color="light" onClick={() => setShowTimePicker(false)}>
                <IonIcon icon={arrowBack} slot="icon-only"></IonIcon>
              </IonButton>
              <IonTitle>Select Time</IonTitle>
              <IonButton slot="end" fill="clear" color="light" onClick={handleSaveTime}>
                Save
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonDatetime
              presentation="time"
              value={`2025-01-01T${notificationTime}:00`}
              onIonChange={handleTimeChange}
            ></IonDatetime>
          </IonContent>
        </IonModal>

        {/* Clear data confirmation alert */}
        <IonAlert
          isOpen={showClearDataAlert}
          onDidDismiss={() => setShowClearDataAlert(false)}
          header="Clear All Data"
          message="This will delete all photos and reset all settings. This action cannot be undone."
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Clear All",
              role: "destructive",
              handler: handleClearAllData,
            },
          ]}
        />

        {/* Success alert */}
        <IonAlert
          isOpen={showSuccessAlert}
          onDidDismiss={() => setShowSuccessAlert(false)}
          header="Success"
          message={alertMessage}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;
