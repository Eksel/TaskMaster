import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  Timestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  members: string[];
  admins: string[];
  inviteCode?: string;
}

interface ChannelInput {
  name: string;
  description?: string;
  isPublic: boolean;
}

interface ChannelContextProps {
  channels: Channel[];
  joinedChannels: Channel[];
  publicChannels: Channel[];
  loading: boolean;
  error: string | null;
  createChannel: (channelInput: ChannelInput) => Promise<string>;
  updateChannel: (id: string, updates: Partial<ChannelInput>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  getChannelById: (channelId: string) => Promise<Channel | null>;
  joinChannelByInviteCode: (inviteCode: string) => Promise<void>;
  addMemberToChannel: (channelId: string, userId: string) => Promise<void>;
  removeMemberFromChannel: (channelId: string, userId: string) => Promise<void>;
  promoteToAdmin: (channelId: string, userId: string) => Promise<void>;
  demoteFromAdmin: (channelId: string, userId: string) => Promise<void>;
  generateInviteCode: (channelId: string) => Promise<string>;
}

const ChannelContext = createContext<ChannelContextProps | null>(null);

export const useChannels = () => {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error('useChannels must be used within a ChannelProvider');
  }
  return context;
};

export const ChannelProvider = ({ children }: { children: ReactNode }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [joinedChannels, setJoinedChannels] = useState<Channel[]>([]);
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setChannels([]);
      setJoinedChannels([]);
      setPublicChannels([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query channels where the user is a member
    const joinedChannelsQuery = query(
      collection(db, 'channels'),
      where('members', 'array-contains', currentUser.uid)
    );

    const unsubscribeJoined = onSnapshot(
      joinedChannelsQuery,
      (snapshot) => {
        const channelsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as Channel[];
        
        setJoinedChannels(channelsList);
        setChannels(channelsList);
      },
      (error) => {
        console.error('Error fetching joined channels:', error);
        setError('Failed to fetch channels');
      }
    );

    // Query public channels
    const publicChannelsQuery = query(
      collection(db, 'channels'),
      where('isPublic', '==', true)
    );

    const unsubscribePublic = onSnapshot(
      publicChannelsQuery,
      (snapshot) => {
        const channelsList = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate()
          })) as Channel[];
        
        // Filter out channels the user has already joined
        const filteredChannels = channelsList.filter(
          (channel) => !channel.members.includes(currentUser.uid)
        );
        
        setPublicChannels(filteredChannels);
      },
      (error) => {
        console.error('Error fetching public channels:', error);
        setError('Failed to fetch public channels');
      }
    );

    setLoading(false);

    return () => {
      unsubscribeJoined();
      unsubscribePublic();
    };
  }, [currentUser]);

  const createChannel = async (channelInput: ChannelInput): Promise<string> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to create a channel');
      
      setError(null);
      const channelData = {
        ...channelInput,
        createdBy: currentUser.uid,
        createdAt: Timestamp.fromDate(new Date()),
        members: [currentUser.uid],
        admins: [currentUser.uid],
        inviteCode: channelInput.isPublic ? null : uuidv4()
      };
      
      const docRef = await addDoc(collection(db, 'channels'), channelData);
      return docRef.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateChannel = async (id: string, updates: Partial<ChannelInput>): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to update a channel');
      
      setError(null);
      const channelRef = doc(db, 'channels', id);
      const channelDoc = await getDoc(channelRef);
      
      if (!channelDoc.exists()) {
        throw new Error('Channel not found');
      }
      
      const channelData = channelDoc.data();
      
      if (!channelData.admins.includes(currentUser.uid)) {
        throw new Error('Only channel admins can update channel details');
      }
      
      await updateDoc(channelRef, updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteChannel = async (id: string): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to delete a channel');
      
      setError(null);
      const channelRef = doc(db, 'channels', id);
      const channelDoc = await getDoc(channelRef);
      
      if (!channelDoc.exists()) {
        throw new Error('Channel not found');
      }
      
      const channelData = channelDoc.data();
      
      if (channelData.createdBy !== currentUser.uid) {
        throw new Error('Only the channel creator can delete the channel');
      }
      
      await deleteDoc(channelRef);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const joinChannel = async (channelId: string): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to join a channel');
      
      setError(null);
      const channelRef = doc(db, 'channels', channelId);
      const channelDoc = await getDoc(channelRef);
      
      if (!channelDoc.exists()) {
        throw new Error('Channel not found');
      }
      
      const channelData = channelDoc.data();
      
      if (channelData.members.includes(currentUser.uid)) {
        throw new Error('You are already a member of this channel');
      }
      
      await updateDoc(channelRef, {
        members: arrayUnion(currentUser.uid)
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const leaveChannel = async (channelId: string): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to leave a channel');
      
      setError(null);
      const channelRef = doc(db, 'channels', channelId);
      const channelDoc = await getDoc(channelRef);
      
      if (!channelDoc.exists()) {
        throw new Error('Channel not found');
      }
      
      const channelData = channelDoc.data();
      
      if (channelData.createdBy === currentUser.uid) {
        throw new Error('Channel creator cannot leave the channel');
      }
      
      await updateDoc(channelRef, {
        members: arrayRemove(currentUser.uid),
        admins: arrayRemove(currentUser.uid)
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getChannelById = async (channelId: string): Promise<Channel | null> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to view a channel');
      
      setError(null);
      const channelRef = doc(db, 'channels', channelId);
      const channelDoc = await getDoc(channelRef);
      
      if (!channelDoc.exists()) {
        return null;
      }
      
      const data = channelDoc.data();
      
      return {
        id: channelDoc.id,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        members: data.members,
        admins: data.admins,
        inviteCode: data.inviteCode
      };
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const joinChannelByInviteCode = async (inviteCode: string): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to join a channel');
      
      setError(null);
      const channelsRef = collection(db, 'channels');
      const q = query(channelsRef, where('inviteCode', '==', inviteCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid invite code');
      }
      
      const channelDoc = querySnapshot.docs[0];
      const channelData = channelDoc.data();
      
      if (channelData.members.includes(currentUser.uid)) {
        throw new Error('You are already a member of this channel');
      }
      
      if (channelData.isPublic) {
        throw new Error('This is a public channel. Use the regular join channel function.');
      }
      
      await updateDoc(doc(db, 'channels', channelDoc.id), {
        members: arrayUnion(currentUser.uid)
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addMemberToChannel = async (channelId: string, userId: string): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to add members');
      
      setError(null);
      const channelRef = doc(db, 'channels', channelId);
      const channelDoc = await getDoc(channelRef);
      
      if (!channelDoc.exists()) {
        throw new Error('Channel not found');
      }
      
      const channelData = channelDoc.data();
      
      if (!channelData.admins.includes(currentUser.uid)) {
        throw new Error('Only channel admins can add members');
      }
      
      await updateDoc(channelRef, {
        members: arrayUnion(userId)
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const removeMemberFromChannel = async (channelId: string, userId: string): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to remove members');
      
      setError(null);
      const channelRef = doc(db, 'channels', channelId);
      const channelDoc = await getDoc(channelRef);
      
      if (!channelDoc.exists()) {
        throw new Error('Channel not found');
      }
      
      const channelData = channelDoc.data();
      
      if (!channelData.admins.includes(currentUser.uid)) {
        throw new Error('Only channel admins can remove members');
      }
      
      if (userId === channelData.createdBy) {
        throw new Error('Cannot remove the channel creator');
      }
      
      await updateDoc(channelRef, {
        members: arrayRemove(userId),
        admins: arrayRemove(userId)
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const promoteToAdmin = async (channelId: string, userId: string): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to promote members');
      
      setError(null);
      const channelRef = doc(db, 'channels', channelId);
      const channelDoc = await getDoc(channelRef);
      
      if (!channelDoc.exists()) {
        throw new Error('Channel not found');
      }
      
      const channelData = channelDoc.data();
      
      if (channelData.createdBy !== currentUser.uid) {
        throw new Error('Only the channel creator can promote members to admin');
      }
      
      if (!channelData.members.includes(userId)) {
        throw new Error('User must be a member of the channel first');
      }
      
      await updateDoc(channelRef, {
        admins: arrayUnion(userId)
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const demoteFromAdmin = async (channelId: string, userId: string): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to demote admins');
      
      setError(null);
      const channelRef = doc(db, 'channels', channelId);
      const channelDoc = await getDoc(channelRef);
      
      if (!channelDoc.exists()) {
        throw new Error('Channel not found');
      }
      
      const channelData = channelDoc.data();
      
      if (channelData.createdBy !== currentUser.uid) {
        throw new Error('Only the channel creator can demote admins');
      }
      
      if (userId === channelData.createdBy) {
        throw new Error('Cannot demote the channel creator');
      }
      
      await updateDoc(channelRef, {
        admins: arrayRemove(userId)
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const generateInviteCode = async (channelId: string): Promise<string> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to generate invite codes');
      
      setError(null);
      const channelRef = doc(db, 'channels', channelId);
      const channelDoc = await getDoc(channelRef);
      
      if (!channelDoc.exists()) {
        throw new Error('Channel not found');
      }
      
      const channelData = channelDoc.data();
      
      if (!channelData.admins.includes(currentUser.uid)) {
        throw new Error('Only channel admins can generate invite codes');
      }
      
      const newInviteCode = uuidv4();
      
      await updateDoc(channelRef, {
        inviteCode: newInviteCode
      });
      
      return newInviteCode;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    channels,
    joinedChannels,
    publicChannels,
    loading,
    error,
    createChannel,
    updateChannel,
    deleteChannel,
    joinChannel,
    leaveChannel,
    getChannelById,
    joinChannelByInviteCode,
    addMemberToChannel,
    removeMemberFromChannel,
    promoteToAdmin,
    demoteFromAdmin,
    generateInviteCode
  };

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
};