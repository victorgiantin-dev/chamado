import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUserRole: (role: 'operador' | 'mecanico') => void;
}

const AUTH_STORAGE_KEY = 'sysmanut_current_user_v1';

const SYSTEM_ACCOUNTS: Record<string, { pass: string; user: User }> = {
  operador: {
    pass: 'operador123',
    user: {
      username: 'operador',
      name: 'Carlos Silva',
      role: 'operador',
      badge: 'OP-449',
      department: 'Linha de Produção & Usinagem',
    },
  },
  mecanico: {
    pass: 'mecanico123',
    user: {
      username: 'mecanico',
      name: 'Roberto Martins',
      role: 'mecanico',
      badge: 'MEC-102',
      department: 'Manutenção Mecânica & Eletropneumática',
    },
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler usuário salvo', e);
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = (usernameInput: string, passInput: string) => {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passInput.trim();

    const account = SYSTEM_ACCOUNTS[cleanUser];
    if (!account) {
      return {
        success: false,
        error: 'Usuário não encontrado. Use "operador" ou "mecanico".',
      };
    }

    if (account.pass !== cleanPass) {
      return {
        success: false,
        error: 'Senha incorreta para este usuário.',
      };
    }

    setUser(account.user);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const switchUserRole = (role: 'operador' | 'mecanico') => {
    const account = SYSTEM_ACCOUNTS[role];
    if (account) {
      setUser(account.user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
