import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            // El redirect se manejará automáticamente cuando cambie el estado de autenticación
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-md">
                {/* Card de Login */}
                <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12">
                    {/* Logo y Título */}
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-2">
                            Paviotti
                        </h1>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
                            Gestión Vehicular
                        </p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campo Email */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-colors font-bold text-slate-900 placeholder:text-slate-400"
                                placeholder="tu@email.com"
                                required
                                autoComplete="email"
                                autoFocus
                            />
                        </div>

                        {/* Campo Contraseña */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-wider">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-colors font-bold text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Mensaje de Error */}
                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-600 font-bold text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Botón de Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black uppercase py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.98] relative overflow-hidden group"
                        >
                            <span className="relative z-10">
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Ingresando...
                                    </span>
                                ) : (
                                    'Ingresar al Sistema'
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400 font-medium">
                            Paviotti Fleet Management System v1.0
                        </p>
                    </div>
                </div>

                {/* Info adicional */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                        ¿Problemas para acceder? Contacte al administrador
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
