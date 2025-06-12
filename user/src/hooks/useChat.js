import { useState, useEffect, useCallback } from 'react';
import { useSocketContext } from '../contexts/SocketContext';

const useChat = (roomId) => {
    const { socket, isConnected, joinRoom, sendMessage, startTyping, stopTyping, on } = useSocketContext();
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (isConnected && roomId) {
            joinRoom(roomId);
        }
    }, [isConnected, roomId, joinRoom]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (message) => {
            setMessages(prev => [...prev, message]);
        };

        const handleRoomUsers = (userList) => {
            setUsers(userList);
        };

        const handleUserJoined = (user) => {
            setUsers(prev => [...prev, user]);
        };

        const handleUserLeft = (user) => {
            setUsers(prev => prev.filter(u => u.userId !== user.userId));
        };



        // Register event listeners
        const unsubscribers = [
            on('receive_message', handleReceiveMessage),
            on('room_users', handleRoomUsers),
            on('user_joined', handleUserJoined),
            on('user_left', handleUserLeft),
        ].filter(Boolean);

        return () => {
            unsubscribers.forEach(unsub => unsub && unsub());
        };
    }, [socket, on]);

    // Send message function
    const handleSendMessage = useCallback((content) => {

        sendMessage(content, roomId);

    }, [sendMessage, roomId]);



    return {
        messages,
        users,
        isConnected,
        sendMessage: handleSendMessage,
    };
};

export default useChat;