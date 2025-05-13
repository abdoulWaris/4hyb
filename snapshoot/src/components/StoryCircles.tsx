import React, { useState, useEffect } from "react";
import { IonModal, IonAvatar, IonIcon, IonSpinner, IonGrid, IonRow, IonCol, IonText, IonButton } from "@ionic/react";
import { add, camera } from "ionicons/icons";
import { StoryWithUser, getFeedStories, getNearbyStories } from "../services/story.service";
import { useAuthContext } from "../contexts/AuthContext";
import StoryViewer from "./StoryViewer";
import { CameraSource } from "@capacitor/camera";
import { takePicture, createPhotoWithLocation } from "../services/camera.service";
import { createStory } from "../services/story.service";
import "./StoryCircles.css";

interface StoryCirclesProps {
  onCreateStory?: () => void;
  showCreateButton?: boolean;
  type?: "feed" | "nearby";
  maxDistance?: number;
}

const StoryCircles: React.FC<StoryCirclesProps> = ({
  onCreateStory,
  showCreateButton = true,
  type = "feed",
  maxDistance = 20,
}) => {
  const { user } = useAuthContext();
  const [stories, setStories] = useState<StoryWithUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [showStoryViewer, setShowStoryViewer] = useState<boolean>(false);
  const [isCreatingStory, setIsCreatingStory] = useState<boolean>(false);

  useEffect(() => {
    loadStories();
  }, [type, maxDistance]);

  const loadStories = async () => {
    try {
      setIsLoading(true);

      let storyData: StoryWithUser[] = [];

      if (type === "feed") {
        storyData = await getFeedStories();
      } else if (type === "nearby") {
        storyData = await getNearbyStories(maxDistance);
      }

      setStories(storyData);
    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index);
    setShowStoryViewer(true);
  };

  const handleStoryClose = () => {
    setShowStoryViewer(false);
    setSelectedStoryIndex(null);
  };

  const handleStoryDelete = (storyId: string) => {
    setStories((prevStories) => prevStories.filter((story) => story.id !== storyId));
  };

  const handleCreateStory = async () => {
    if (onCreateStory) {
      onCreateStory();
      return;
    }

    try {
      setIsCreatingStory(true);

      // Take a photo using the device camera
      const photo = await takePicture({
        quality: 90,
        source: CameraSource.Camera,
        width: 1200,
        height: 1600,
        allowEditing: true,
        presentationStyle: "fullscreen",
      });

      if (photo && photo.webPath) {
        // Create photo data with location
        const photoData = await createPhotoWithLocation(photo, true, "story");

        // Create story
        await createStory(photoData);

        // Reload stories
        loadStories();
      }
    } catch (error) {
      console.error("Error creating story:", error);
    } finally {
      setIsCreatingStory(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      return "now";
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h`;
    } else {
      return `${Math.floor(diffHours / 24)}d`;
    }
  };

  return (
    <div className="story-circles-container">
      {isLoading ? (
        <div className="story-loading">
          <IonSpinner name="dots" />
        </div>
      ) : stories.length === 0 && !showCreateButton ? (
        <div className="no-stories">
          <IonText color="medium">
            <p>No stories available</p>
          </IonText>
        </div>
      ) : (
        <div className="stories-scroll">
          {showCreateButton && (
            <div className="story-circle create-story">
              <div
                className={`circle-avatar create-button ${isCreatingStory ? "loading" : ""}`}
                onClick={isCreatingStory ? undefined : handleCreateStory}
              >
                {isCreatingStory ? <IonSpinner name="crescent" /> : <IonIcon icon={add} />}
              </div>
              <div className="username">Your story</div>
            </div>
          )}

          {stories.map((story, index) => (
            <div
              key={story.id}
              className={`story-circle ${story.viewed ? "viewed" : "unviewed"}`}
              onClick={() => handleStoryClick(index)}
            >
              <div className="circle-avatar">
                {story.user.profilePicture ? (
                  <img src={story.user.profilePicture} alt={story.user.username} />
                ) : (
                  <div className="default-avatar">{story.user.username.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="username">
                {story.user.username}
                {type === "nearby" && story.locationName && <div className="location-tag">{story.locationName}</div>}
                <div className="time-tag">{formatTime(story.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <IonModal
        isOpen={showStoryViewer}
        onDidDismiss={handleStoryClose}
        backdropDismiss={false}
        className="story-modal"
      >
        {selectedStoryIndex !== null && stories.length > 0 && (
          <StoryViewer
            stories={stories}
            initialIndex={selectedStoryIndex}
            onClose={handleStoryClose}
            onDelete={handleStoryDelete}
          />
        )}
      </IonModal>
    </div>
  );
};

export default StoryCircles;
