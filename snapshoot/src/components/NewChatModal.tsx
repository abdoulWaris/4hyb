import React, { useState, useEffect } from "react";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonText,
  IonInput,
  useIonRouter,
} from "@ionic/react";
import { close, personAdd, people, checkmark } from "ionicons/icons";
import { searchUsers, User } from "../services/auth.service";
import { getOrCreateConversation, createGroupConversation } from "../services/chat.service";
import "./NewChatModal.css";

interface NewChatModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onSuccess }) => {
  const router = useIonRouter();

  const [searchText, setSearchText] = useState<string>("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isGroupMode, setIsGroupMode] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>("");

  useEffect(() => {
    if (searchText.trim().length > 0) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchText]);

  const handleSearch = async () => {
    if (searchText.trim().length === 0) return;

    try {
      setIsSearching(true);
      const users = await searchUsers(searchText);
      setSearchResults(users);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: User) => {
    if (isGroupMode) {
      // In group mode, add to selection
      if (selectedUsers.some((u) => u.id === user.id)) {
        // Already selected, remove from selection
        setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
      } else {
        // Add to selection
        setSelectedUsers([...selectedUsers, user]);
      }
    } else {
      // In direct message mode, start conversation immediately
      handleStartConversation(user);
    }
  };

  const handleStartConversation = async (user: User) => {
    try {
      setIsCreating(true);
      const conversation = await getOrCreateConversation(user.id);

      // Navigate to conversation
      router.push(`/app/conversation/${conversation.id}`);

      // Notify parent of success
      onSuccess();
    } catch (error) {
      console.error("Error starting conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length < 2 || !groupName.trim()) return;

    try {
      setIsCreating(true);
      const userIds = selectedUsers.map((user) => user.id);
      const conversation = await createGroupConversation(userIds, groupName);

      // Navigate to conversation
      router.push(`/app/conversation/${conversation.id}`);

      // Notify parent of success
      onSuccess();
    } catch (error) {
      console.error("Error creating group conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleGroupMode = () => {
    setIsGroupMode(!isGroupMode);
    setSelectedUsers([]);
  };

  const renderUserItem = (user: User) => {
    const isSelected = selectedUsers.some((u) => u.id === user.id);

    return (
      <IonItem
        key={user.id}
        className={`user-item ${isSelected ? "selected" : ""}`}
        onClick={() => handleUserSelect(user)}
        button
        detail={false}
      >
        <IonAvatar slot="start">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.username} />
          ) : (
            <div className="default-avatar">{user.username.charAt(0).toUpperCase()}</div>
          )}
        </IonAvatar>

        <IonLabel>
          <h2>{user.username}</h2>
          {user.fullName && <p>{user.fullName}</p>}
        </IonLabel>

        {isGroupMode && isSelected && <IonIcon slot="end" icon={checkmark} className="selected-icon" />}
      </IonItem>
    );
  };

  const renderContent = () => {
    if (isSearching) {
      return (
        <div className="center-content">
          <IonSpinner name="crescent" />
          <IonText color="medium">
            <p>Searching users...</p>
          </IonText>
        </div>
      );
    }

    if (searchText && searchResults.length === 0) {
      return (
        <div className="center-content">
          <IonText color="medium">
            <p>No users found for "{searchText}"</p>
          </IonText>
        </div>
      );
    }

    return <IonList className="user-list">{searchResults.map(renderUserItem)}</IonList>;
  };

  const renderGroupOptions = () => {
    if (!isGroupMode) return null;

    return (
      <div className="group-options">
        <IonItem className="group-name-input">
          <IonLabel position="floating">Group Name</IonLabel>
          <IonInput
            value={groupName}
            onIonChange={(e) => setGroupName(e.detail.value!)}
            placeholder="Enter a name for your group"
            maxlength={30}
          />
        </IonItem>

        {selectedUsers.length > 0 && (
          <div className="selected-users">
            <IonText className="selected-users-title">Selected Users ({selectedUsers.length})</IonText>
            <div className="selected-users-list">
              {selectedUsers.map((user) => (
                <div key={user.id} className="selected-user-chip">
                  <span>{user.username}</span>
                  <IonIcon
                    icon={close}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <IonButton
          expand="block"
          onClick={handleCreateGroup}
          disabled={selectedUsers.length < 2 || !groupName.trim() || isCreating}
          className="create-group-button"
        >
          {isCreating ? (
            <IonSpinner name="dots" />
          ) : (
            <>
              <IonIcon slot="start" icon={people} />
              Create Group Chat
            </>
          )}
        </IonButton>
      </div>
    );
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose} disabled={isCreating}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle>{isGroupMode ? "New Group" : "New Message"}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={toggleGroupMode} disabled={isCreating}>
              <IonIcon icon={isGroupMode ? personAdd : people} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="new-chat-content">
        <div className="search-container">
          <IonSearchbar
            value={searchText}
            onIonChange={(e) => setSearchText(e.detail.value!)}
            placeholder={`Search ${isGroupMode ? "users for group" : "users"}`}
            debounce={300}
            animated
            showClearButton="always"
          />
        </div>

        {renderGroupOptions()}
        {renderContent()}
      </IonContent>
    </>
  );
};

export default NewChatModal;
