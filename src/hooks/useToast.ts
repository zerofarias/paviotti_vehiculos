import { useState, useCallback } from 'react';
import type { Toast, ToastType } from '../components/Toast';

export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: Toast = {
            id,
            message,
            type,
            duration
        };

        setToasts((prev) => [...prev, newToast]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message: string, duration?: number) => {
        addToast(message, 'success', duration);
    }, [addToast]);

    const showError = useCallback((message: string, duration?: number) => {
        addToast(message, 'error', duration);
    }, [addToast]);

    const showWarning = useCallback((message: string, duration?: number) => {
        addToast(message, 'warning', duration);
    }, [addToast]);

    const showInfo = useCallback((message: string, duration?: number) => {
        addToast(message, 'info', duration);
    }, [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
};
