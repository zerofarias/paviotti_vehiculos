import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastNotificationProps {
    toast: Toast;
    onClose: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, toast.duration || 4000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onClose]);

    const getToastStyles = () => {
        switch (toast.type) {
            case 'success':
                return {
                    bg: 'bg-emerald-500',
                    icon: '✅',
                    border: 'border-emerald-600'
                };
            case 'error':
                return {
                    bg: 'bg-red-500',
                    icon: '❌',
                    border: 'border-red-600'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-500',
                    icon: '⚠️',
                    border: 'border-amber-600'
                };
            case 'info':
                return {
                    bg: 'bg-blue-500',
                    icon: 'ℹ️',
                    border: 'border-blue-600'
                };
            default:
                return {
                    bg: 'bg-slate-500',
                    icon: '📋',
                    border: 'border-slate-600'
                };
        }
    };

    const styles = getToastStyles();

    return (
        <div
            className={`${styles.bg} ${styles.border} border-2 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] max-w-md animate-in slide-in-from-right-full duration-300 backdrop-blur-lg`}
        >
            <span className="text-2xl">{styles.icon}</span>
            <p className="flex-1 font-bold text-sm">{toast.message}</p>
            <button
                onClick={() => onClose(toast.id)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center font-black text-lg transition-colors"
            >
                ×
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastNotification toast={toast} onClose={onClose} />
                </div>
            ))}
        </div>
    );
};

export default ToastNotification;
