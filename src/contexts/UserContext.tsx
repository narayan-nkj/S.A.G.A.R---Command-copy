import React, { createContext, useContext, useState } from 'react';

interface UserProfile {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface UserContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const defaultProfile: UserProfile = {
  fullName: 'Operator 04',
  email: 'operator04@sagar.gov.in',
  avatarUrl: null,
  role: 'Senior Analyst',
};

export const UserContext = createContext<UserContextType>({
  profile: defaultProfile,
  updateProfile: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
};
