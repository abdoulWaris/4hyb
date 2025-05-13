import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonInput,
  IonItem,
  IonToggle,
  IonFooter,
  IonLabel,
  IonToast,
} from "@ionic/react";
import {
  close,
  location,
  image,
  camera,
  send,
  checkmarkCircle,
  flashOutline,
  flashOffOutline,
  timeOutline,
} from "ionicons/icons";
import { takePicture, createPhotoWithLocation, PhotoData } from "../services/camera.service";
import { createStory } from "../services/story.service";
import { getCurrentLocation, getLocationName } from "../services/location.service";
import { CameraSource, CameraResultType } from "@capacitor/camera";
import "./StoryCreator.css";

interface StoryCreatorProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const StoryCreator: React.FC<StoryCreatorProps> = ({ onClose, onSuccess }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [caption, setCaption] = useState<string>("");
  const [useLocation, setUseLocation] = useState<boolean>(true);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const handleTakePhoto = async () => {
    try {
      setIsCapturing(true);

      const photo = await takePicture({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        width: 1200,
        height: 1600,
        correctOrientation: true,
        presentationStyle: "fullscreen",
        saveToGallery: false,
      });

      if (photo && photo.webPath) {
        setCapturedImage(photo.webPath);

        // Check for location if enabled
        if (useLocation) {
          const currentLocation = await getCurrentLocation();
          if (currentLocation) {
            const name = await getLocationName(currentLocation.latitude, currentLocation.longitude);
            setLocationName(name);
          } else {
            setToastMessage("Could not get location");
            setShowToast(true);
            setUseLocation(false);
          }
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      setToastMessage("Failed to take photo");
      setShowToast(true);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCreateStory = async () => {
    if (!capturedImage) return;

    try {
      setIsCreating(true);

      // Create photo with location if enabled
      const photo = { webPath: capturedImage } as any;
      const photoData = await createPhotoWithLocation(photo, useLocation, "story");

      // Create story
      await createStory(photoData);

      // Notify success
      if (onSuccess) {
        onSuccess();
      }

      // Show success message
      setToastMessage("Story created successfully!");
      setShowToast(true);

      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error creating story:", error);
      setToastMessage("Failed to create story");
      setShowToast(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setCaption("");
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  const toggleLocation = () => {
    setUseLocation(!useLocation);
  };

  return (
    <>
      <IonHeader>
        <IonToolbar color="dark">
          <IonButtons slot="start">
            <IonButton onClick={onClose} color="light">
              <IonIcon slot="icon-only" icon={close} />
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            {!capturedImage ? (
              <>
                <IonButton onClick={toggleFlash} color="light">
                  <IonIcon slot="icon-only" icon={flashEnabled ? flashOutline : flashOffOutline} />
                </IonButton>
              </>
            ) : (
              <IonButton onClick={handleReset} color="light">
                <IonIcon slot="icon-only" icon={camera} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="story-creator-content">
        {capturedImage ? (
          <div className="preview-container">
            <img src={capturedImage} alt="Preview" className="preview-image" />

            <div className="caption-container">
              <IonItem lines="none" className="caption-item">
                <IonInput
                  value={caption}
                  onIonChange={(e) => setCaption(e.detail.value!)}
                  placeholder="Add a caption..."
                  maxlength={100}
                  className="caption-input"
                />
              </IonItem>

              <IonItem lines="none" className="location-toggle-item">
                <IonIcon icon={location} slot="start" color={useLocation ? "primary" : "medium"} />
                <IonLabel>Include location</IonLabel>
                <IonToggle checked={useLocation} onIonChange={(e) => setUseLocation(e.detail.checked)} />
              </IonItem>

              {useLocation && locationName && (
                <div className="location-info">
                  <IonIcon icon={location} color="primary" />
                  <IonText color="medium">{locationName}</IonText>
                </div>
              )}

              <div className="expiry-info">
                <IonIcon icon={timeOutline} />
                <IonText color="medium">Story will expire after 24 hours</IonText>
              </div>
            </div>
          </div>
        ) : (
          <div className="camera-container">
            {isCapturing ? (
              <div className="capturing-overlay">
                <IonSpinner name="crescent" />
                <IonText color="light">Taking photo...</IonText>
              </div>
            ) : (
              <div className="camera-placeholder" onClick={handleTakePhoto}>
                <IonIcon icon={camera} />
                <IonText>Tap to take a photo</IonText>
              </div>
            )}
          </div>
        )}
      </IonContent>

      {capturedImage && (
        <IonFooter className="story-creator-footer">
          <IonButton expand="block" onClick={handleCreateStory} disabled={isCreating} className="create-button">
            {isCreating ? (
              <IonSpinner name="dots" />
            ) : (
              <>
                <IonIcon slot="start" icon={send} />
                Share to Story
              </>
            )}
          </IonButton>
        </IonFooter>
      )}

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />
    </>
  );
};

export default StoryCreator;
