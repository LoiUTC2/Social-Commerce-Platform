import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const useSocket = (token) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    token = token || localStorage.getItem("token")
    useEffect(() => {
        if (!token) {
            console.log("Authorize error. Not found token")
            return;
        }

        // Initialize socket connection
        socketRef.current = io('http://localhost:5000', {
            auth: { token },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const socket = socketRef.current;

        // Connection event handlers
        socket.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
            setError(null);
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('Connection error:', err.message);
            setError(err.message);
            setIsConnected(false);
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [token]);

    return {
        socket: socketRef.current,
        isConnected,
        error
    };
};

export default useSocket;