import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as UserEntity } from '@/api/entities';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const userData = await UserEntity.me();
      setUser(userData);
    } catch (error) {
      console.log("User not authenticated, using demo mode");
      // Set default demo user for non-authenticated users
      setUser({ 
        user_type: 'employer', 
        full_name: 'רפאל (דוגמה)', 
        email: 'demo@example.com',
        isDemo: true 
      });
    } finally {
      setLoading(false);
    }
  };

  const switchUserType = async () => {
    console.log('Current user before switch:', user);
    const newUserType = user?.user_type === 'employer' ? 'job_seeker' : 'employer';
    console.log('Switching to user type:', newUserType);
    
    const newUser = { 
      ...user, 
      user_type: newUserType, 
      full_name: newUserType === 'job_seeker' ? 'דניאל (מחפש עבודה)' : 'רפאל (מעסיק)',
      isDemo: true
    };
    
    console.log('New user object:', newUser);
    
    // Update local state immediately
    setUser(newUser);
    
    // For demo users, we don't need to update the database
    // Just log the switch for debugging
    console.log(`Switched to ${newUserType} mode`);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const value = {
    user,
    loading,
    switchUserType,
    setUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

