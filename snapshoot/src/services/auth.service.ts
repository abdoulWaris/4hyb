import { Preferences } from "@capacitor/preferences";

// Keys for auth storage
const AUTH_TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "user_data";

export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  fullName?: string;
  bio?: string;
  following?: string[];
  followers?: string[];
  createdAt: number;
}

/**
 * Register a new user
 * @param email User email
 * @param username User username
 * @param password User password
 * @returns Promise with the user data
 */
export const register = async (email: string, username: string, password: string): Promise<User> => {
  try {
    // This is a mock implementation since we don't have a backend yet
    // In a real app, this would call an API endpoint

    // Check if user already exists
    const existingUsers = await getUsers();
    const userExists = existingUsers.some((user) => user.email === email || user.username === username);

    if (userExists) {
      throw new Error("User already exists");
    }

    // Create new user
    const timestamp = new Date().getTime();
    const newUser: User = {
      id: `user_${timestamp}`,
      email,
      username,
      profilePicture: undefined,
      fullName: undefined,
      bio: undefined,
      following: [],
      followers: [],
      createdAt: timestamp,
    };

    // Save user to "database"
    await saveUser(newUser);

    // Generate token (in a real app, this would be from the server)
    const token = `token_${timestamp}`;
    await saveAuthToken(token);

    // Save current user
    await saveCurrentUser(newUser);

    return newUser;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

/**
 * Login a user
 * @param emailOrUsername User email or username
 * @param password User password
 * @returns Promise with the user data
 */
export const login = async (emailOrUsername: string, password: string): Promise<User> => {
  try {
    // This is a mock implementation since we don't have a backend yet
    // In a real app, this would call an API endpoint

    // Find user
    const users = await getUsers();
    const user = users.find((user) => user.email === emailOrUsername || user.username === emailOrUsername);

    if (!user) {
      throw new Error("User not found");
    }

    // In a real app, we would check the password here
    // For now, we just simulate a successful login

    // Generate token (in a real app, this would be from the server)
    const token = `token_${new Date().getTime()}`;
    await saveAuthToken(token);

    // Save current user
    await saveCurrentUser(user);

    return user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  try {
    await Preferences.remove({ key: AUTH_TOKEN_KEY });
    await Preferences.remove({ key: USER_DATA_KEY });
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

/**
 * Check if a user is authenticated
 * @returns Promise with boolean indicating if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const result = await Preferences.get({ key: AUTH_TOKEN_KEY });
    return !!result.value;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

/**
 * Get the current authenticated user
 * @returns Promise with the user data or null if not authenticated
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const result = await Preferences.get({ key: USER_DATA_KEY });

    if (!result.value) {
      return null;
    }

    return JSON.parse(result.value);
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

/**
 * Update the current user profile
 * @param userData User data to update
 * @returns Promise with the updated user data
 */
export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  try {
    // Get current user
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Update user data
    const updatedUser: User = {
      ...currentUser,
      ...userData,
    };

    // Update user in "database"
    await updateUser(updatedUser);

    // Update current user
    await saveCurrentUser(updatedUser);

    return updatedUser;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Follow a user
 * @param userId ID of the user to follow
 * @returns Promise with the updated user data
 */
export const followUser = async (userId: string): Promise<User> => {
  try {
    // Get current user
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Check if already following
    if (currentUser.following?.includes(userId)) {
      return currentUser;
    }

    // Update following list
    const following = currentUser.following || [];
    following.push(userId);

    // Update user
    const updatedUser = {
      ...currentUser,
      following,
    };

    // Update user in "database"
    await updateUser(updatedUser);

    // Update current user
    await saveCurrentUser(updatedUser);

    // Update the followed user's followers list
    const followedUser = await getUserById(userId);
    if (followedUser) {
      const followers = followedUser.followers || [];
      followers.push(currentUser.id);

      const updatedFollowedUser = {
        ...followedUser,
        followers,
      };

      await updateUser(updatedFollowedUser);
    }

    return updatedUser;
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
};

/**
 * Unfollow a user
 * @param userId ID of the user to unfollow
 * @returns Promise with the updated user data
 */
export const unfollowUser = async (userId: string): Promise<User> => {
  try {
    // Get current user
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Check if not following
    if (!currentUser.following?.includes(userId)) {
      return currentUser;
    }

    // Update following list
    const following = currentUser.following.filter((id) => id !== userId);

    // Update user
    const updatedUser = {
      ...currentUser,
      following,
    };

    // Update user in "database"
    await updateUser(updatedUser);

    // Update current user
    await saveCurrentUser(updatedUser);

    // Update the unfollowed user's followers list
    const unfollowedUser = await getUserById(userId);
    if (unfollowedUser) {
      const followers = unfollowedUser.followers?.filter((id) => id !== currentUser.id) || [];

      const updatedUnfollowedUser = {
        ...unfollowedUser,
        followers,
      };

      await updateUser(updatedUnfollowedUser);
    }

    return updatedUser;
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};

/**
 * Search for users
 * @param query Search query
 * @returns Promise with array of matching users
 */
export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    if (!query) {
      return [];
    }

    // Get all users
    const users = await getUsers();

    // Filter users based on query
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        (user.fullName && user.fullName.toLowerCase().includes(query.toLowerCase()))
    );
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};

// ---- Helper functions for mock database ----

/**
 * Save auth token to storage
 * @param token Auth token
 */
const saveAuthToken = async (token: string): Promise<void> => {
  await Preferences.set({
    key: AUTH_TOKEN_KEY,
    value: token,
  });
};

/**
 * Save current user data to storage
 * @param user User data
 */
const saveCurrentUser = async (user: User): Promise<void> => {
  await Preferences.set({
    key: USER_DATA_KEY,
    value: JSON.stringify(user),
  });
};

/**
 * Get all users from "database"
 * @returns Array of users
 */
const getUsers = async (): Promise<User[]> => {
  const result = await Preferences.get({ key: "users" });

  if (!result.value) {
    return [];
  }

  return JSON.parse(result.value);
};

/**
 * Save a new user to "database"
 * @param user User data to save
 */
const saveUser = async (user: User): Promise<void> => {
  // Get existing users
  const users = await getUsers();

  // Add new user
  users.push(user);

  // Save updated users
  await Preferences.set({
    key: "users",
    value: JSON.stringify(users),
  });
};

/**
 * Update a user in "database"
 * @param user User data to update
 */
const updateUser = async (user: User): Promise<void> => {
  // Get existing users
  const users = await getUsers();

  // Find and update user
  const index = users.findIndex((u) => u.id === user.id);

  if (index !== -1) {
    users[index] = user;

    // Save updated users
    await Preferences.set({
      key: "users",
      value: JSON.stringify(users),
    });
  }
};

/**
 * Get a user by ID
 * @param userId User ID
 * @returns User data or null if not found
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  // Get all users
  const users = await getUsers();

  // Find user by ID
  const user = users.find((u) => u.id === userId);

  return user || null;
};

/**
 * Get multiple users by IDs
 * @param userIds Array of user IDs
 * @returns Array of users
 */
export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
  if (!userIds || userIds.length === 0) {
    return [];
  }

  // Get all users
  const users = await getUsers();

  // Filter users by IDs
  return users.filter((user) => userIds.includes(user.id));
};
