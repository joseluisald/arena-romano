import { User, AuthState } from '../types';

const STORAGE_KEYS = {
  TOKEN: 'arena_romano_auth_token',
  USER: 'arena_romano_auth_user',
};

type AuthListener = (state: AuthState) => void;

class AuthService {
  private user: User | null = null;
  private token: string | null = null;
  private listeners: Set<AuthListener> = new Set();
  private isChecking: boolean = true;

  constructor() {
    this.loadFromStorage();
    // Validate session with backend in background
    if (this.token) {
      this.verifyToken();
    } else {
      this.isChecking = false;
    }
  }

  private loadFromStorage() {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
      }
    } catch (e) {
      console.error('Erro ao carregar sessão local:', e);
    }
  }

  private saveToStorage(token: string, user: User) {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('Erro ao salvar sessão local:', e);
    }
  }

  private clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.error('Erro ao limpar sessão local:', e);
    }
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): AuthState {
    return {
      user: this.user,
      token: this.token,
      isAuthenticated: Boolean(this.user && this.token),
    };
  }

  public getToken(): string | null {
    return this.token;
  }

  public getUser(): User | null {
    return this.user;
  }

  public getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  public async verifyToken(): Promise<boolean> {
    if (!this.token) {
      this.isChecking = false;
      return false;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.user) {
          this.user = data.user;
          this.saveToStorage(this.token, this.user!);
          this.notify();
          this.isChecking = false;
          return true;
        }
      }

      // If invalid or expired, gracefully log out
      this.logout();
    } catch {
      // Network offline - keep local session
    } finally {
      this.isChecking = false;
    }

    return false;
  }

  public async login(usernameOrEmail: string, password: string): Promise<{ ok: boolean; error?: string; user?: User }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || 'Erro ao realizar login.',
        };
      }

      this.token = data.token;
      this.user = data.user;
      this.saveToStorage(this.token!, this.user!);
      this.notify();

      return {
        ok: true,
        user: this.user!,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err.message || 'Falha de conexão com o servidor.',
      };
    }
  }

  public async register(
    name: string,
    username: string,
    email: string,
    password: string,
    role: 'admin' | 'operador' = 'operador'
  ): Promise<{ ok: boolean; error?: string; user?: User }> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || 'Erro ao cadastrar usuário.',
        };
      }

      this.token = data.token;
      this.user = data.user;
      this.saveToStorage(this.token!, this.user!);
      this.notify();

      return {
        ok: true,
        user: this.user!,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err.message || 'Falha de conexão com o servidor.',
      };
    }
  }

  public async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
      } catch {
        // Silently ignore network failures on logout
      }
    }

    this.token = null;
    this.user = null;
    this.clearStorage();
    this.notify();
  }

  public async fetchServerLogs(): Promise<any[]> {
    try {
      const response = await fetch('/api/logs', {
        headers: this.getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.logs || [];
      }
    } catch (e) {
      console.warn('Erro ao buscar logs:', e);
    }
    return [];
  }

  public async fetchDbStatus(): Promise<any> {
    try {
      const response = await fetch('/api/db/status');
      return await response.json();
    } catch (e: any) {
      return { connected: false, error: e.message };
    }
  }

  public async triggerDbInit(): Promise<any> {
    try {
      const response = await fetch('/api/db/init', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      return await response.json();
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }
}

export const authService = new AuthService();
