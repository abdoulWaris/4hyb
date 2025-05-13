import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonFab,
  IonFabButton,
  IonModal,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonRouter,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonPopover,
  IonActionSheet,
} from "@ionic/react";
import { pencil, chevronForward, personAdd, search, people, chevronDownCircle, add, addOutline } from "ionicons/icons";
import { useAuthContext } from "../contexts/AuthContext";
import { getConversations, ConversationWithUsers } from "../services/chat.service";
import NewChatModal from "../components/NewChatModal";
import GroupChatCreator from "../components/GroupChatCreator";
import "./Chat.css";

const Chat: React.FC = () => {
  const { user } = useAuthContext();
  const router = useIonRouter();

  const [conversations, setConversations] = useState<ConversationWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [showGroupCreator, setShowGroupCreator] = useState<boolean>(false);
  const [fabPopoverOpen, setFabPopoverOpen] = useState<boolean>(false);
  const [conversationType, setConversationType] = useState<string>("all");
  const [showActionSheet, setShowActionSheet] = useState<boolean>(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const userConversations = await getConversations();
      setConversations(userConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    loadConversations().then(() => {
      event.detail.complete();
    });
  };

  const handleSearchChange = (e: CustomEvent) => {
    setSearchText(e.detail.value);
  };

  const handleNewChat = () => {
    setShowNewChatModal(true);
    setFabPopoverOpen(false);
  };

  const handleNewGroupChat = () => {
    setShowGroupCreator(true);
    setFabPopoverOpen(false);
  };

  const handleFabClick = (e: any) => {
    e.persist();
    setFabPopoverOpen(true);
  };

  const handleNewChatSuccess = () => {
    setShowNewChatModal(false);
    loadConversations();
  };

  const handleGroupCreated = (conversationId: string) => {
    setShowGroupCreator(false);
    loadConversations();

    // Navigate to the new conversation
    router.push(`/app/conversation/${conversationId}`);
  };

  const formatLastMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return "Yesterday";
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations
    .filter((conversation) => {
      // Filter by search text
      if (searchText) {
        if (conversation.isGroup && conversation.groupName) {
          return conversation.groupName.toLowerCase().includes(searchText.toLowerCase());
        } else if (!conversation.isGroup && conversation.users.length > 0) {
          return conversation.users[0].username.toLowerCase().includes(searchText.toLowerCase());
        }
        return false;
      }

      // Filter by conversation type
      if (conversationType === "direct") {
        return !conversation.isGroup;
      } else if (conversationType === "group") {
        return conversation.isGroup;
      }

      return true; // "all" type
    })
    .sort((a, b) => {
      // Sort by last message time
      const timeA = a.lastMessage ? a.lastMessage.createdAt : a.updatedAt;
      const timeB = b.lastMessage ? b.lastMessage.createdAt : b.updatedAt;
      return timeB - timeA;
    });

  const renderConversationItem = (conversation: ConversationWithUsers) => {
    if (conversation.isGroup) {
      // Group conversation
      return (
        <IonItem
          key={conversation.id}
          routerLink={`/app/conversation/${conversation.id}`}
          detail={false}
          className="conversation-item"
        >
          <div className="group-avatar" slot="start">
            {conversation.groupAvatar ? (
              <img src={conversation.groupAvatar} alt={conversation.groupName} />
            ) : (
              <div className="group-avatar-placeholder">
                <IonIcon icon={people} />
              </div>
            )}
          </div>

          <IonLabel>
            <h2>{conversation.groupName || "Group Chat"}</h2>
            {conversation.lastMessage && <p className="message-preview">{conversation.lastMessage.content}</p>}
          </IonLabel>

          {conversation.lastMessage && (
            <div className="conversation-time" slot="end">
              <span>{formatLastMessageTime(conversation.lastMessage.createdAt)}</span>
              <IonIcon icon={chevronForward} />
            </div>
          )}
        </IonItem>
      );
    } else {
      // Direct conversation
      const otherUser = conversation.users[0];

      if (!otherUser) return null;

      return (
        <IonItem
          key={conversation.id}
          routerLink={`/app/conversation/${conversation.id}`}
          detail={false}
          className="conversation-item"
        >
          <IonAvatar slot="start">
            {otherUser.profilePicture ? (
              <img src={otherUser.profilePicture} alt={otherUser.username} />
            ) : (
              <div className="default-avatar">{otherUser.username.charAt(0).toUpperCase()}</div>
            )}
          </IonAvatar>

          <IonLabel>
            <h2>{otherUser.username}</h2>
            {conversation.lastMessage && (
              <p className="message-preview">
                {conversation.lastMessage.senderId === user?.id ? (
                  <span className="message-preview-you">You: </span>
                ) : null}
                {conversation.lastMessage.content}
              </p>
            )}
          </IonLabel>

          {conversation.lastMessage && (
            <div className="conversation-time" slot="end">
              <span>{formatLastMessageTime(conversation.lastMessage.createdAt)}</span>
              <IonIcon icon={chevronForward} />
            </div>
          )}
        </IonItem>
      );
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="spinner-container">
          <IonSpinner name="crescent" />
          <IonText color="medium">
            <p>Loading conversations...</p>
          </IonText>
        </div>
      );
    }

    if (conversations.length === 0) {
      return (
        <div className="empty-state">
          <IonIcon icon={personAdd} className="empty-state-icon" />
          <h2 className="empty-state-title">No Messages Yet</h2>
          <p className="empty-state-message">Start a conversation with someone</p>
          <div className="empty-state-actions">
            <IonButton onClick={handleNewChat}>New Message</IonButton>
            <IonButton onClick={handleNewGroupChat} fill="outline">
              New Group
            </IonButton>
          </div>
        </div>
      );
    }

    if (filteredConversations.length === 0) {
      return (
        <div className="empty-state">
          <IonIcon icon={search} className="empty-state-icon" />
          <h2 className="empty-state-title">No Results</h2>
          <p className="empty-state-message">No conversations found for "{searchText}"</p>
          <IonButton onClick={() => setSearchText("")}>Clear Search</IonButton>
        </div>
      );
    }

    return <IonList className="conversation-list">{filteredConversations.map(renderConversationItem)}</IonList>;
  };

  return (
    <IonPage className="chat-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Messages</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={chevronDownCircle}
            pullingText="Pull to refresh"
            refreshingSpinner="circles"
            refreshingText="Refreshing..."
          />
        </IonRefresher>

        <div className="search-container">
          <IonSearchbar
            value={searchText}
            onIonChange={handleSearchChange}
            placeholder="Search conversations"
            debounce={300}
            animated
            showClearButton="always"
          />
        </div>

        <IonSegment
          value={conversationType}
          onIonChange={(e) => setConversationType(e.detail.value!)}
          className="conversation-segment"
        >
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="direct">
            <IonLabel>Direct</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="group">
            <IonLabel>Groups</IonLabel>
            <IonBadge color="primary" className="group-badge">
              {conversations.filter((c) => c.isGroup).length}
            </IonBadge>
          </IonSegmentButton>
        </IonSegment>

        {renderContent()}

        <IonFab vertical="bottom" horizontal="end" slot="fixed" className="chat-fab">
          <IonFabButton onClick={handleFabClick}>
            <IonIcon icon={add} />
          </IonFabButton>

          <IonPopover isOpen={fabPopoverOpen} onDidDismiss={() => setFabPopoverOpen(false)} className="chat-popover">
            <IonList className="popover-list">
              <IonItem button onClick={handleNewChat} detail={false}>
                <IonIcon slot="start" icon={personAdd} />
                <IonLabel>New Message</IonLabel>
              </IonItem>
              <IonItem button onClick={handleNewGroupChat} detail={false}>
                <IonIcon slot="start" icon={people} />
                <IonLabel>New Group</IonLabel>
              </IonItem>
            </IonList>
          </IonPopover>
        </IonFab>

        <IonModal isOpen={showNewChatModal} onDidDismiss={() => setShowNewChatModal(false)} className="new-chat-modal">
          <NewChatModal onClose={() => setShowNewChatModal(false)} onSuccess={handleNewChatSuccess} />
        </IonModal>

        <IonModal
          isOpen={showGroupCreator}
          onDidDismiss={() => setShowGroupCreator(false)}
          className="group-creator-modal"
        >
          <GroupChatCreator onClose={() => setShowGroupCreator(false)} onSuccess={handleGroupCreated} />
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Chat;
