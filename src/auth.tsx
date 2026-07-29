import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Cloudflare OpenAuth 連携の認証コンテキスト。
 *
 * Cloudflare OpenAuth は外部の認証サーバー（OIDC / OAuth 2.0 認可サーバー）として動作し、
 * 認可コードフローでアクセストークンを発行します。本アプリは以下のフローを想定:
 *
 *  1. ユーザーが「NEON LOGIN」を押す → OpenAuth 認可エンドポイントへリダイレクト
 *  2. 認証後、コールバックURL（本アプリの /#/callback ）にリダイレクトで戻る
 *  3. 認可コードをトークンエンドポイントへ送り、ID/アクセストークンを取得
 *  4. トークンを localStorage に保存し、ユーザー情報を取り出す
 *
 * 環境変数でエンドポイントを設定:
 *   VITE_OAUTH_AUTH_URL     … 認可エンドポイント
 *   VITE_OAUTH_TOKEN_URL    … トークンエンドポイント
 *   VITE_OAUTH_USERINFO_URL … UserInfo エンドポイント
 *   VITE_OAUTH_CLIENT_ID    … クライアントID
 *   VITE_OAUTH_REDIRECT_URI … リダイレクトURI
 *
 * これらが未設定の場合は「デモモード」として動作し、任意のユーザー名でログインできます。
 * これにより、OpenAuth サーバーが未構成でもアプリ全体を動作確認できます。
 */

export interface AuthUser {
  username: string;
  displayName: string;
  avatarHue: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  demoLogin: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'neon_arcade_auth';

const cfg = {
  authUrl: import.meta.env.VITE_OAUTH_AUTH_URL as string | undefined,
  tokenUrl: import.meta.env.VITE_OAUTH_TOKEN_URL as string | undefined,
  userinfoUrl: import.meta.env.VITE_OAUTH_USERINFO_URL as string | undefined,
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID as string | undefined,
  redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI as string | undefined,
};

export function isOAuthConfigured(): boolean {
  return Boolean(cfg.authUrl && cfg.tokenUrl && cfg.clientId && cfg.redirectUri);
}

function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId!,
    redirect_uri: cfg.redirectUri!,
    response_type: 'code',
    scope: 'openid profile',
  });
  const sep = cfg.authUrl!.includes('?') ? '&' : '?';
  return `${cfg.authUrl}${sep}${params.toString()}`;
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveUser(user: AuthUser | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // コールバックURL（#/callback）で認可コードを処理
  useEffect(() => {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#/callback')) return;

    const params = new URLSearchParams(hash.replace('#/callback', ''));
    const code = params.get('code');
    const err = params.get('error');

    if (err) {
      setError(`認証エラー: ${err}`);
      window.location.hash = '';
      return;
    }

    if (!code) {
      window.location.hash = '';
      return;
    }

    // 認可コードをトークンと交換（OpenAuth 連携時）
    setLoading(true);
    setError(null);

    if (!isOAuthConfigured()) {
      // 設定がない場合はコードをユーザー名として扱う（デモ用）
      const demoUser: AuthUser = {
        username: 'demo_user',
        displayName: 'DEMO PLAYER',
        avatarHue: 180,
      };
      saveUser(demoUser);
      setUser(demoUser);
      setLoading(false);
      window.location.hash = '';
      return;
    }

    // 本来はトークンエンドポイントへ POST してトークンを取得し、
    // UserInfo エンドポイントでユーザー情報を取り出す。
    // ここではフェッチを実行し、失敗時はデモモードへフォールバック。
    fetch(cfg.tokenUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: cfg.clientId!,
        redirect_uri: cfg.redirectUri!,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`token exchange failed (${res.status})`);
        const tokenData = await res.json();
        const accessToken: string | undefined = tokenData.access_token;
        if (!accessToken) throw new Error('no access_token in response');

        // UserInfo からユーザー情報を取得
        if (cfg.userinfoUrl) {
          const uiRes = await fetch(cfg.userinfoUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (uiRes.ok) {
            const info = await uiRes.json();
            const username: string = info.preferred_username || info.sub || 'player';
            const authedUser: AuthUser = {
              username,
              displayName: (info.name || username).toString().toUpperCase(),
              avatarHue: hashHue(username),
            };
            saveUser(authedUser);
            setUser(authedUser);
            setLoading(false);
            window.location.hash = '';
            return;
          }
        }
        throw new Error('userinfo unavailable');
      })
      .catch((e: unknown) => {
        // OpenAuth サーバーに到達できない環境ではデモユーザーで続行
        const demoUser: AuthUser = {
          username: 'demo_user',
          displayName: 'DEMO PLAYER',
          avatarHue: 180,
        };
        saveUser(demoUser);
        setUser(demoUser);
        setError(`OpenAuth へ接続できなかったためデモモードで続行します (${String(e)})`);
        setLoading(false);
        window.location.hash = '';
      });
  }, []);

  const login = useCallback(() => {
    setError(null);
    if (!isOAuthConfigured()) {
      // デモモード: ランダムなゲストユーザーで即ログイン
      const guest = `guest_${Math.floor(Math.random() * 9000 + 1000)}`;
      const demoUser: AuthUser = {
        username: guest,
        displayName: guest.toUpperCase(),
        avatarHue: hashHue(guest),
      };
      saveUser(demoUser);
      setUser(demoUser);
      return;
    }
    window.location.href = buildAuthUrl();
  }, []);

  const demoLogin = useCallback((username: string) => {
    const clean = username.trim() || 'player';
    const demoUser: AuthUser = {
      username: clean,
      displayName: clean.toUpperCase(),
      avatarHue: hashHue(clean),
    };
    saveUser(demoUser);
    setUser(demoUser);
  }, []);

  const logout = useCallback(() => {
    saveUser(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, login, demoLogin, logout }),
    [user, loading, error, login, demoLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}
