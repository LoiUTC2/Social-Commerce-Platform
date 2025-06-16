// contexts/FollowContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { checkFollowStatus, batchCheckFollowStatus } from '../services/followService';

const FollowContext = createContext();

export const useFollow = () => {
    const context = useContext(FollowContext);
    if (!context) {
        throw new Error('useFollow must be used within a FollowProvider');
    }
    return context;
};

export const FollowProvider = ({ children }) => {
    const [followStatus, setFollowStatus] = useState({}); // Cache follow status

    const getFollowStatus = useCallback(async (targetId, targetType) => {
        const key = `${targetId}_${targetType}`;

        // Kiểm tra cache trước
        if (followStatus[key] !== undefined) {
            return followStatus[key];
        }

        try {
            const res = await checkFollowStatus({ targetId, targetType });
            const isFollowing = res.data.isFollowing;

            // Cache kết quả
            setFollowStatus(prev => ({
                ...prev,
                [key]: isFollowing
            }));

            return isFollowing;
        } catch (err) {
            console.error('Error checking follow status:', err);
            return false;
        }
    }, [followStatus]);

    const updateFollowStatus = useCallback((targetId, targetType, isFollowing) => {
        const key = `${targetId}_${targetType}`;
        setFollowStatus(prev => ({
            ...prev,
            [key]: isFollowing
        }));
    }, []);

    const clearFollowCache = useCallback(() => {
        setFollowStatus({});
    }, []);

    return (
        <FollowContext.Provider value={{
            getFollowStatus,
            updateFollowStatus,
            clearFollowCache
        }}>
            {children}
        </FollowContext.Provider>
    );
};