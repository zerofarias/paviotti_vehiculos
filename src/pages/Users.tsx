import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import type { User } from '../types';
import { ICONS } from '../constants';

interface UsersPageProps {
  // users: User[]; // Removed from props
  // setUsers: React.Dispatch<React.SetStateAction<User[]>>; // Removed from props
}

const UsersPage: React.FC<UsersPageProps> = () => {
  const [users, setUsers] = useState<User[]>([]); // Internal state for users
  const [loading, setLoading] = useState(true); // Loading state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    role: UserRole.EMPLOYEE,
    active: true,
    licenseExpiration: '',
    photo: '',
    licensePhoto: ''
  });
  const [showLicenseViewer, setShowLicenseViewer] = useState(false);

  // Fetch users from API on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users:', response.statusText);
        alert('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error de conexión al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: UserRole.EMPLOYEE,
      active: true,
      licenseExpiration: '',
      photo: '',
      licensePhoto: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    // Format date for input field (YYYY-MM-DD)
    const formattedDate = user.licenseExpiration ? new Date(user.licenseExpiration).toISOString().split('T')[0] : '';
    setFormData({ ...user, licenseExpiration: formattedDate });
    setShowModal(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar a este usuario?')) {
      try {
        const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setUsers(users.filter(u => u.id !== id));
        } else {
          console.error('Failed to delete user:', response.statusText);
          alert('Error al eliminar usuario');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error de conexión al eliminar usuario');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photo' | 'licensePhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedUser = await response.json();
        if (editingUser) {
          setUsers(users.map(u => u.id === savedUser.id ? savedUser : u));
        } else {
          setUsers([...users, savedUser]);
        }
        setShowModal(false);
      } else {
        console.error('Failed to save user:', response.statusText);
        alert('Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error de conexión al guardar');
    }
  };

  const getLicenseStatus = (date?: string) => {
    if (!date) return { label: 'Sin datos', color: 'text-slate-400 bg-slate-100', borderColor: 'border-slate-200', type: 'none' };
    const exp = new Date(date).getTime();
    const now = new Date().getTime();
    const diff = (exp - now) / (1000 * 60 * 60 * 24);

    if (diff < 0) return { label: 'VENCIDA', color: 'text-red-700 bg-red-100', borderColor: 'border-red-200', type: 'expired' };
    if (diff < 30) return { label: 'POR VENCER', color: 'text-amber-700 bg-amber-100', borderColor: 'border-amber-200', type: 'warning' };
    return { label: 'AL DÍA', color: 'text-emerald-700 bg-emerald-100', borderColor: 'border-emerald-200', type: 'ok' };
  };

  const expiredCount = users.filter(u => getLicenseStatus(u.licenseExpiration).type === 'expired').length;
  const warningCount = users.filter(u => getLicenseStatus(u.licenseExpiration).type === 'warning').length;

  if (loading) {
    return <div className="w-full h-96 flex items-center justify-center text-slate-400 font-bold animate-pulse">Cargando personal...</div>;
  }

  return (
    <div className="w-full space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Personal</h2>
          <p className="text-slate-500 font-medium">Gestión de accesos y control de licencias.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
          Nuevo Empleado
        </button>
      </header>

      {/* Alerta de Licencias Vencidas */}
      {(expiredCount > 0 || warningCount > 0) && (
        <div className={`p-6 rounded-[2rem] border-2 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top duration-500 ${expiredCount > 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${expiredCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
            <ICONS.Alert className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className={`text-lg font-black uppercase tracking-tighter ${expiredCount > 0 ? 'text-red-900' : 'text-amber-900'}`}>
              Atención: Control de Licencias
            </h4>
            <p className={`text-sm font-medium ${expiredCount > 0 ? 'text-red-700' : 'text-amber-700'}`}>
              Se han detectado {expiredCount > 0 ? `${expiredCount} licencias vencidas` : ''}
              {expiredCount > 0 && warningCount > 0 ? ' y ' : ''}
              {warningCount > 0 ? `${warningCount} por vencer próximamente` : ''}.
            </p>
          </div>
        </div>
      )}

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => {
          const lic = getLicenseStatus(u.licenseExpiration);
          return (
            <div
              key={u.id}
              onClick={() => handleOpenEdit(u)}
              className={`group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col ${!u.active ? 'opacity-60 grayscale' : ''}`}
            >
              {/* STATUS INDICATOR BAR */}
              <div className={`h-2 w-full ${u.active ? 'bg-blue-500 group-hover:bg-blue-600' : 'bg-slate-300'}`}></div>

              <div className="p-8 flex-1 flex flex-col items-center text-center">
                {/* AVATAR */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg group-hover:shadow-blue-200/50 transition-all">
                    {u.photo ? (
                      <img src={u.photo} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt="Avatar" />
                    )}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-md border-2 border-white ${u.role === UserRole.ADMIN ? 'bg-indigo-600' : 'bg-blue-500'}`}>
                    {u.role === UserRole.ADMIN ? 'Admin' : 'Staff'}
                  </div>
                </div>

                {/* NAME & EMAIL */}
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1 group-hover:text-blue-700 transition-colors">{u.name}</h3>
                <p className="text-xs text-slate-400 font-bold mb-6">{u.email}</p>

                {/* LICENSE INFO CARD */}
                <div className={`w-full p-4 rounded-2xl border ${lic.borderColor} ${lic.color.replace('text-', 'bg-').replace('700', '50')} mb-6`}>
                  <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">Licencia de Conducir</p>
                  <p className={`text-xs font-black uppercase ${lic.color.split(' ')[0]}`}>{lic.label}</p>
                  {u.licenseExpiration && <p className="text-[9px] font-bold mt-1 opacity-70">Vence: {new Date(u.licenseExpiration).toLocaleDateString()}</p>}
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                  <span className="text-[8px] font-black uppercase tracking-widest">{u.active ? 'Activo' : 'Inactivo'}</span>
                </div>

                <div className="flex gap-2">
                  {/* Toggle Active Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const response = await fetch(`/api/users/${u.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...u, active: !u.active })
                        });
                        if (response.ok) {
                          const updated = await response.json();
                          setUsers(users.map(user => user.id === updated.id ? updated : user));
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Error al actualizar estado');
                      }
                    }}
                    className={`px-3 py-2 flex items-center justify-center gap-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${u.active
                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                      }`}
                    title={u.active ? 'Desactivar usuario' : 'Activar usuario'}
                  >
                    {u.active ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Desactivar
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Activar
                      </>
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(u.id, e)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500 hover:shadow-md transition-all"
                    title="Eliminar usuario"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Button Card Placeholder */}
        <button
          onClick={handleOpenAdd}
          className="group min-h-[300px] rounded-[2.5rem] border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-4 text-slate-300 hover:text-blue-500"
        >
          <div className="w-16 h-16 rounded-full bg-slate-50 group-hover:bg-white group-hover:shadow-lg flex items-center justify-center transition-all">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Registrar Nuevo</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <header className="px-10 py-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {editingUser ? 'Actualizar Ficha' : 'Nuevo Personal'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-900 text-4xl font-light">×</button>
            </header>

            <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Datos de Acceso */}
              <section className="space-y-6">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2">Datos de Cuenta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 flex items-center gap-6">
                    <div className="relative group shrink-0">
                      <div className="w-24 h-24 rounded-[2rem] bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {formData.photo ? (
                          <img src={formData.photo} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" /></svg>
                        )}
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <p className="text-[9px] font-black text-slate-400 mt-2 text-center uppercase">Subir Foto</p>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre completo" />
                      </div>
                      <div>
                        <input required type="email" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email corporativo" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contraseña</label>
                    <input type="password" required={!editingUser} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-sm" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rol de Usuario</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                      <button type="button" onClick={() => setFormData({ ...formData, role: UserRole.EMPLOYEE })} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${formData.role === UserRole.EMPLOYEE ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>STAFF</button>
                      <button type="button" onClick={() => setFormData({ ...formData, role: UserRole.ADMIN })} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${formData.role === UserRole.ADMIN ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>ADMIN</button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Datos de Conducción */}
              <section className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Habilitación de Manejo</h4>
                  {formData.licenseExpiration && (
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${getLicenseStatus(formData.licenseExpiration).color}`}>
                      {getLicenseStatus(formData.licenseExpiration).label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vencimiento Licencia</label>
                    <input type="date" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-sm" value={formData.licenseExpiration} onChange={e => setFormData({ ...formData, licenseExpiration: e.target.value })} />
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[9px] text-emerald-800 font-bold uppercase leading-tight">Mantener este dato actualizado es vital para la cobertura del seguro de la flota.</p>
                    </div>
                  </div>
                  <div className="relative group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Foto Carnet (Dorsal)</label>
                    <div className="w-full h-40 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative transition-all">
                      {formData.licensePhoto ? (
                        <img src={formData.licensePhoto} className="w-full h-full object-contain" alt="" />
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 text-slate-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          <p className="text-[9px] font-bold text-slate-300">SUBIR IMAGEN</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      {formData.licensePhoto && (
                        <button
                          type="button"
                          onClick={() => setShowLicenseViewer(true)}
                          className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Ver Carnet
                        </button>
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          {formData.licensePhoto ? 'Cambiar' : 'Subir'}
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'licensePhoto')} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] uppercase tracking-widest text-sm">
                Confirmar Datos
              </button>
            </form>
          </div>
        </div>
      )}

      {/* License Photo Viewer Modal */}
      {showLicenseViewer && formData.licensePhoto && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[120] flex items-center justify-center p-4" onClick={() => setShowLicenseViewer(false)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowLicenseViewer(false)}
              className="absolute -top-12 right-0 text-white hover:text-blue-400 transition-colors"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="p-4 bg-slate-900 text-white">
                <h3 className="text-lg font-black uppercase tracking-tight">Carnet de Conducir - {formData.name}</h3>
              </div>
              <div className="p-8 bg-slate-50 flex items-center justify-center">
                <img
                  src={formData.licensePhoto}
                  alt="Carnet de Conducir"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
