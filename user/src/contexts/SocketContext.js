import React, { createContext, useContext, useCallback } from 'react';
import useSocket from '../hooks/useSocket';

const SocketContext = createContext();

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children, token }) => {
    const { socket, isConnected, error } = useSocket(token);

    // Socket event handlers
    const joinRoom = useCallback((roomId) => {
        if (socket) {
            socket.emit('join_room', roomId);
        }
    }, [socket]);

    const sendMessage = useCallback((content, roomId) => {
        if (socket) {
            socket.emit('send_message', { content, roomId });
        }
    }, [socket]);

    // Event listeners helper
    const on = useCallback((event, callback) => {
        if (socket) {
            socket.on(event, callback);
            return () => socket.off(event, callback);
        }
    }, [socket]);

    const off = useCallback((event, callback) => {
        if (socket) {
            socket.off(event, callback);
        }
    }, [socket]);

    const value = {
        socket,
        isConnected,
        error,
        joinRoom,
        sendMessage,
        on,
        off
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};