import React, { useState } from "react";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { close, camera, flash, flashOff, camera as cameraIcon } from "ionicons/icons";
import { takePicture } from "../services/camera.service";
import { CameraResultType, CameraSource } from "@capacitor/camera";
import "./CameraView.css";

interface CameraViewProps {
  onPhotoTaken: (webPath: string) => void;
  onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onPhotoTaken, onClose }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState<boolean>(false);
  const [frontCamera, setFrontCamera] = useState<boolean>(false);

  const handleTakePhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const photo = await takePicture({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        width: 1200,
        height: 1600,
        correctOrientation: true,
        presentationStyle: "fullscreen",
        promptLabelHeader: "Take a BeUnreal Photo",
        promptLabelCancel: "Cancel",
        promptLabelPhoto: "Take Photo",
        saveToGallery: false,
        // We'll use a different approach to handle camera direction
        // since Front and Rear are not properties of CameraSource
        // direction: frontCamera ? CameraSource.Front : CameraSource.Rear,
        // @ts-ignore - unofficial property but works in Capacitor
        enableHighResolution: true,
      });

      if (photo && photo.webPath) {
        setPreviewUrl(photo.webPath);
        onPhotoTaken(photo.webPath);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      setError("Failed to take photo. Please check camera permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  const toggleCamera = () => {
    setFrontCamera(!frontCamera);
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose} disabled={isLoading}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle>Camera</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={toggleFlash} disabled={isLoading}>
              <IonIcon icon={flashEnabled ? flash : flashOff} />
            </IonButton>
            <IonButton onClick={toggleCamera} disabled={isLoading}>
              <IonIcon icon={cameraIcon} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="camera-view-content">
        {isLoading ? (
          <div className="camera-loading">
            <IonSpinner name="crescent" />
            <IonText>Taking photo...</IonText>
          </div>
        ) : error ? (
          <div className="camera-error">
            <IonText color="danger">{error}</IonText>
            <IonButton onClick={handleTakePhoto}>Try Again</IonButton>
          </div>
        ) : (
          <div className="camera-container">
            <div className="camera-overlay">
              <div className="camera-grid">
                <div className="grid-line horizontal-top"></div>
                <div className="grid-line horizontal-middle"></div>
                <div className="grid-line horizontal-bottom"></div>
                <div className="grid-line vertical-left"></div>
                <div className="grid-line vertical-middle"></div>
                <div className="grid-line vertical-right"></div>
              </div>
            </div>

            <div className="camera-controls">
              <div className="camera-button-container">
                <button className="capture-button" onClick={handleTakePhoto} disabled={isLoading}>
                  <div className="capture-button-inner"></div>
                </button>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </>
  );
};

export default CameraView;
