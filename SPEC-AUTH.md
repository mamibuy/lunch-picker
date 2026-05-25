# 會員系統實作規格（針對現有 lunch-picker 專案）

> **目的**：在現有 Next.js + Vercel + Google Sheet CSV 專案上，加入會員系統。
> **檔名建議**：`SPEC-AUTH.md`，放在專案根目錄與既有的 `SPEC.md` 並存。
> **適用版本**：現有專案為 Next.js 16 + React 19 + Tailwind 4 + TypeScript（見 `package.json`）。
> **使用方式**：把這份規格交給 Claude Code 接著做。

---

## 一、為什麼是現在做、為什麼這樣做

### 現在做的理由
1. **收藏功能（`lp-fav-shops`）目前存在 localStorage**，換手機就消失。要綁帳號才有意義。
2. **偏好分類（`preferred-categories`、`prefer-any`）同樣存 localStorage**，需要跟著使用者走。
3. **未來揪飯友、求跑腿都需要使用者身份**，先把會員地基打好，後續直接接上。
4. **底部導覽的「我的」分頁目前是佔位**，正好用來放登入後的個人頁。

### 技術選型
| 項目 | 選擇 | 理由 |
|------|------|------|
| 身份驗證 | **Supabase Auth + Email Magic Link** | 免密碼、UX 好、零基礎友善、免費額度夠 |
| 資料庫 | **Supabase Postgres** | 與 Auth 整合最深、有 Row Level Security 可保護資料 |
| Client SDK | `@supabase/supabase-js` + `@supabase/ssr` | Next.js App Router 官方推薦組合 |
| 部署 | 維持 Vercel | 不變動 |

### 未來轉移到公司 AWS 的可行性
- Supabase 本身跑在 AWS 上，搬遷時兩條路：(A) 繼續用 Supabase（最簡單），(B) 改用 AWS Cognito + RDS（IT 接手後再評估）。
- 程式碼裡所有 Supabase 呼叫集中在 `src/lib/supabase/` 與 `src/lib/auth/`，未來換系統時改這兩個資料夾即可，其他元件不動。**這個架構約束本身就是搬遷準備**。

---

## 二、Supabase 設定步驟（給開發者照著做）

> 請 Claude Code 在執行到對應步驟時，主動提醒開發者去 Supabase Dashboard 操作，並引導每一步該點哪裡。

### Step 1：建立 Supabase 專案
1. 到 https://supabase.com 註冊（建議用未來會交給公司的 email，但目前先用個人 email 也可以，搬遷時可建第二個專案）。
2. 建立新 Project，名稱可填 `lunch-picker-dev`（之後正式環境另建一個）。
3. 設定 Database password，**記在密碼管理器，不要存到 Git**。
4. Region 選 **Tokyo (ap-northeast-1)** 或 **Singapore (ap-southeast-1)**，台灣連線速度好。
5. 等專案建立完成（約 2 分鐘）。

### Step 2：取得連線資訊
專案建好後到 Project Settings → API：
- `Project URL`（公開可用）
- `anon public key`（公開可用，用於前端）
- `service_role secret key`（**絕對不能放前端、不能 commit**）

### Step 3：設定環境變數
在專案根目錄的 `.env.local` 加入：
```
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role secret key>
```
- 確認 `.gitignore` 已排除 `.env.local`（現有專案已排除，OK）。
- 同步到 Vercel：Vercel Dashboard → Project → Settings → Environment Variables，加入相同三個變數。**`SUPABASE_SERVICE_ROLE_KEY` 只在 Production 環境加入、且只用於 Server Side**。

### Step 4：設定 Email 模板（Magic Link）
Supabase Dashboard → Authentication → Email Templates → Magic Link：
1. 把 Subject 改成中文，例如「上班吃什麼：登入連結」。
2. 把 Body 改成中文版本，內容包含登入連結與「若非本人請忽略」提醒。
3. **這步必做**，否則同事收到的會是英文預設模板，體驗很糟。

### Step 5：設定登入限制（公司網域）
Supabase Dashboard → Authentication → Settings → Auth Providers → Email：
- **暫時做法**：先不限制，方便開發階段測試。
- **正式上線前**：在 `signInWithOtp` 呼叫前，於前端先檢查 email 結尾是否為公司網域（見第四節程式範例）。若未來需要在 Supabase 層強制，可用 Database Function + Trigger 攔截，但此階段先在前端檢查。

### Step 6：安裝 SDK
在專案根目錄執行：
```
npm install @supabase/supabase-js @supabase/ssr
```

---

## 三、資料庫結構

到 Supabase Dashboard → SQL Editor 執行以下 SQL（請 Claude Code 在引導時把這段 SQL 提供給開發者貼上執行）：

```sql
-- 使用者個人資料（與 auth.users 一對一）
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  department text,
  avatar_url text,
  phone text,                  -- 選填，敏感
  common_address text,         -- 選填，敏感
  birthday_md text,            -- MM-DD 格式，選填
  company_id text default 'default',  -- 預留多公司擴充
  is_staff_committee boolean default false,
  is_platform_admin boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 收藏（取代 localStorage 的 lp-fav-shops）
create table public.favorites (
  user_id uuid references auth.users(id) on delete cascade,
  shop_id text not null,       -- 對應 Google Sheet 的店家 id
  created_at timestamptz default now(),
  primary key (user_id, shop_id)
);

-- 偏好分類（取代 localStorage 的 preferred-categories / prefer-any）
create table public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_categories text[] default '{}',
  prefer_any boolean default false,
  updated_at timestamptz default now()
);

-- 個資查看記錄（福委會幹部查看員工敏感資料時記錄）
create table public.privacy_access_logs (
  id bigserial primary key,
  viewer_id uuid references auth.users(id),
  target_id uuid references auth.users(id),
  fields_accessed text[],      -- 例如 ['phone', 'common_address']
  accessed_at timestamptz default now()
);

-- 自動更新 updated_at
create or replace function public.touch_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_preferences_updated_at before update on public.preferences
  for each row execute function public.touch_updated_at();

-- 新使用者註冊時自動建立 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.preferences (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Row Level Security（RLS）— 安全的關鍵

**必做**：所有資料表都要開 RLS，否則任何登入者都能讀別人的資料。

```sql
-- 開啟 RLS
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.preferences enable row level security;
alter table public.privacy_access_logs enable row level security;

-- profiles：自己讀寫自己；所有登入者可讀基本欄位（不含 phone、common_address）
-- 用 view 處理「公開檢視」，敏感欄位用單獨 policy
create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

-- 「公開檢視」由前端透過 view 取得，不直接 select profiles 表，見下方 public_profiles view
create view public.public_profiles as
  select id, display_name, department, avatar_url, is_staff_committee
  from public.profiles
  where is_active = true;

-- favorites：自己讀寫自己
create policy "favorites_select_self" on public.favorites
  for select using (auth.uid() = user_id);
create policy "favorites_insert_self" on public.favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites_delete_self" on public.favorites
  for delete using (auth.uid() = user_id);

-- preferences：自己讀寫自己
create policy "preferences_all_self" on public.preferences
  for all using (auth.uid() = user_id);

-- 福委會幹部專用權限（讀取所有人 profiles 含敏感欄位 → 透過 server-side 並寫入 log）
-- 本階段先不開放福委會直接 select profiles，改由後台 API endpoint 處理並寫入 privacy_access_logs
-- 這部分留待福委會後台功能開發時實作
```

> 重點原則：**敏感欄位（phone、common_address）只能在「server-side 並寫入存取記錄」的情況下被福委會幹部讀取**，不開放直接 SQL 查詢。

---

## 四、程式碼實作

### 4.1 檔案結構（在現有 `src/` 下新增）

```
src/
  lib/
    supabase/
      client.ts              # 前端 Supabase client
      server.ts              # 後端 Supabase client（Server Components / Route Handlers）
      middleware.ts          # 用於 middleware 的 client
    auth/
      config.ts              # 公司網域、登入相關設定
      migrateLocalData.ts    # 把 localStorage 資料遷移到資料庫
    favorites.ts             # 新檔，取代 FavButton 內的 getFavIds/setFavIds
    preferences.ts           # 改寫，從 localStorage 改為 Supabase
  app/
    login/
      page.tsx               # 登入頁
    auth/
      callback/
        route.ts             # Magic Link 點擊後的 callback
    profile/
      page.tsx               # 改寫現有佔位頁
  components/
    AuthProvider.tsx         # Context provider 包住整個 app
    FavButton.tsx            # 改寫，從 localStorage 改成 Supabase
  middleware.ts              # Next.js middleware，處理 session refresh
```

### 4.2 設定檔

`src/lib/auth/config.ts`：
```ts
// 公司網域：未來變多公司時，這裡會擴展為陣列或從資料庫讀取
export const ALLOWED_EMAIL_DOMAIN = '公司網域.com'; // 例如 'yourcompany.com'

export function isAllowedEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}
```

### 4.3 Supabase Client（Next.js 16 + App Router）

請 Claude Code 直接參考 Supabase 官方 `@supabase/ssr` 套件對 Next.js App Router 的最新指引產出三個 client（browser、server、middleware）。**這部分官方範例變動頻繁，請以執行當下的官方 docs 為準，不要照舊版範例**。

關鍵原則：
- 前端用 `createBrowserClient`（`anon key`）。
- Server Components 用 `createServerClient`（`anon key` + cookies）。
- **`service_role_key` 絕對不出現在這三個檔案**，只在「福委會後台」等明確需要繞過 RLS 的 server-side API 路由用。

### 4.4 登入流程

`src/app/login/page.tsx`（核心邏輯）：
```ts
'use client';
import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { isAllowedEmail, ALLOWED_EMAIL_DOMAIN } from '@/lib/auth/config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAllowedEmail(email)) {
      setErrorMsg(`請使用 @${ALLOWED_EMAIL_DOMAIN} 公司 Email`);
      setStatus('error');
      return;
    }
    setStatus('sending');
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  // 畫面：保持「上班吃什麼」品牌調性，暖色系（#FDEEDD 主色、#FF7A45 強調色）
  // 設計重點：
  //  - 標題「上班吃什麼」+ 標語
  //  - 一行說明：「輸入公司 Email，我們寄登入連結給你」
  //  - Email 輸入框（大、好點）
  //  - 「寄送登入連結」按鈕
  //  - status === 'sent' 時：「已寄出！請到 email 點擊連結」+ 重寄按鈕（60 秒倒數）
  //  - status === 'error' 時：顯示 errorMsg
  //  - 不需要密碼欄位
  return ( /* ... 由 Claude Code 依照上方設計實作 ... */ );
}
```

### 4.5 Auth Callback

`src/app/auth/callback/route.ts`：
```ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 登入成功，導回首頁（或原本想去的頁面）
      // 注意：localStorage 資料遷移在前端 layout 或 AuthProvider 內處理，不在這
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL('/login?error=auth_failed', url.origin));
}
```

### 4.6 Middleware（保持 session 新鮮）

`src/middleware.ts`：依官方 `@supabase/ssr` 範例實作，**這個檔案必做**，否則 Server Components 拿不到使用者 session。

### 4.7 AuthProvider（包住整個 app）

`src/components/AuthProvider.tsx`：
- 提供 `useAuth()` hook，回傳 `{ user, profile, loading, signOut }`。
- 在 user 從 null 變為有值（剛登入完成）時，**呼叫 `migrateLocalData()`**（見 4.9）。
- 在 `src/app/layout.tsx` 把 `<body>` 內容用 `<AuthProvider>` 包起來。

---

## 五、收藏功能遷移（localStorage → 資料庫）

這是這份規格的重點之一，必須做對，否則同事第一次登入會發現「我之前收藏的店家不見了」。

### 5.1 遷移邏輯

`src/lib/auth/migrateLocalData.ts`：
```ts
import { createBrowserClient } from '@/lib/supabase/client';

const FAV_KEY = 'lp-fav-shops';
const PREF_CAT_KEY = 'lunch-picker:preferred-categories';
const PREF_ANY_KEY = 'lunch-picker:prefer-any';
const MIGRATED_FLAG = 'lp-migrated-to-cloud';

export async function migrateLocalData(userId: string): Promise<void> {
  // 避免重複遷移
  if (localStorage.getItem(MIGRATED_FLAG) === 'true') return;

  const supabase = createBrowserClient();

  // 1. 遷移收藏
  try {
    const localFavs: string[] = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]');
    if (localFavs.length > 0) {
      // 先讀雲端現有收藏（避免覆蓋）
      const { data: cloudFavs } = await supabase
        .from('favorites')
        .select('shop_id')
        .eq('user_id', userId);
      const cloudIds = new Set((cloudFavs ?? []).map(r => r.shop_id));
      const toInsert = localFavs
        .filter(id => !cloudIds.has(id))
        .map(shop_id => ({ user_id: userId, shop_id }));
      if (toInsert.length > 0) {
        await supabase.from('favorites').insert(toInsert);
      }
    }
  } catch (e) {
    console.warn('遷移收藏失敗', e);
  }

  // 2. 遷移偏好分類
  try {
    const localCats: string[] = JSON.parse(localStorage.getItem(PREF_CAT_KEY) ?? '[]');
    const localAny = localStorage.getItem(PREF_ANY_KEY) === 'true';
    if (localCats.length > 0 || localAny) {
      // 用 upsert，若雲端已有則合併（傾向保留雲端，但若雲端為空白才寫入 local 值）
      const { data: existing } = await supabase
        .from('preferences')
        .select('preferred_categories, prefer_any')
        .eq('user_id', userId)
        .single();
      const cloudCats = existing?.preferred_categories ?? [];
      const merged = Array.from(new Set([...cloudCats, ...localCats])).slice(0, 3);
      await supabase.from('preferences').upsert({
        user_id: userId,
        preferred_categories: merged,
        prefer_any: existing?.prefer_any || localAny,
      });
    }
  } catch (e) {
    console.warn('遷移偏好失敗', e);
  }

  // 3. 標記已遷移
  localStorage.setItem(MIGRATED_FLAG, 'true');

  // 4. 不要立刻刪除 localStorage 原始資料：保留一週作為安全網
  //    遷移成功後，UI 顯示一次「已將你的收藏同步到雲端」提示
}
```

### 5.2 改寫 FavButton

現有 `src/components/FavButton.tsx` 中的 `getFavIds()` / `setFavIds()` 對接 localStorage，要改成：

**情境 A：未登入** → 維持現有 localStorage 行為（同事還沒登入就能用，不擋人）。
**情境 B：已登入** → 讀寫 Supabase `favorites` 資料表，並用 React Query 或 SWR 或 Context 做快取與樂觀更新，否則每次點愛心都等網路 round trip 體驗很差。

具體實作建議：抽出 `src/lib/favorites.ts`：
```ts
import { createBrowserClient } from '@/lib/supabase/client';

const FAV_KEY = 'lp-fav-shops';

// 統一介面：不論登入與否，呼叫方都用這兩個函式
export async function getFavoriteIds(userId: string | null): Promise<string[]> {
  if (!userId) {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]'); } catch { return []; }
  }
  const supabase = createBrowserClient();
  const { data } = await supabase.from('favorites').select('shop_id').eq('user_id', userId);
  return (data ?? []).map(r => r.shop_id);
}

export async function toggleFavorite(userId: string | null, shopId: string): Promise<string[]> {
  if (!userId) {
    const ids: string[] = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]');
    const next = ids.includes(shopId) ? ids.filter(id => id !== shopId) : [...ids, shopId];
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
    return next;
  }
  const supabase = createBrowserClient();
  const current = await getFavoriteIds(userId);
  if (current.includes(shopId)) {
    await supabase.from('favorites').delete().eq('user_id', userId).eq('shop_id', shopId);
    return current.filter(id => id !== shopId);
  } else {
    await supabase.from('favorites').insert({ user_id: userId, shop_id: shopId });
    return [...current, shopId];
  }
}
```

`FavButton.tsx` 改成從 `useAuth()` 拿 `user`，呼叫上面這兩個函式。

### 5.3 改寫 preferences.ts

`src/lib/preferences.ts` 採同樣模式（未登入用 localStorage、已登入用資料庫），呼叫方介面不變或同步調整對應頁面。

### 5.4 重要細節：競爭條件處理
- 同一個 shopId 連點兩下愛心：用 React state 做 optimistic update，UI 馬上反應，後端失敗時 rollback 並提示。
- 多分頁開啟：可暫不處理，下次刷新會自動同步。

---

## 六、畫面規格

### 6.1 登入頁 `/login`
- 暖色背景 `#FDEEDD`，與整體 App 一致。
- 標題「上班吃什麼」+ 標語。
- Email 輸入框（大、圓角、好點）。
- 「寄送登入連結」按鈕，主色 `#FF7A45`。
- 寄送後顯示「請至信箱點擊連結」+ 60 秒後可重寄。
- 公司網域檢查失敗的錯誤提示要清楚。

### 6.2 個人頁 `/profile`（替換現有佔位頁）
**未登入時**：顯示「登入後解鎖：跨裝置同步收藏、未來揪飯友、求跑腿」+ 「登入」按鈕。
**已登入時**：
- 大頭貼（沒設就用名字產生色塊，沿用未來工程師可實作 `avatar` 邏輯）。
- displayName + 部門。
- 「編輯個人資料」按鈕 → 進入編輯頁。
- 我的收藏（小列表，看更多到 `/favorites`）。
- 「登出」按鈕。

### 6.3 編輯個人資料頁 `/profile/edit`
- **必填**：displayName、department。
- **選填**（標籤明確標示「選填」、附上用途說明）：
  - 電話：「用於緊急聯絡或未來求跑腿確認；不會被其他同事看到」
  - 常用地址：「用於未來求跑腿外送；不會被其他同事看到」
  - 生日（月-日）：「用於未來生日小驚喜」
  - 大頭貼上傳（可先跳過，用 Supabase Storage 之後再做）
- 明顯「儲存」按鈕（不要自動同步）。

### 6.4 收藏頁 `/favorites`（替換現有佔位頁）
- **未登入時**：顯示 localStorage 中的收藏（保持目前行為），頁面上方有一條提示「登入後跨裝置同步」。
- **已登入時**：顯示資料庫中的收藏。
- 卡片樣式沿用 `ShopCard` 元件。

### 6.5 首頁與其他頁面
- 不需要強制登入。**核心理念：店家瀏覽永遠免登入可用**，登入是為了解鎖收藏同步、未來互動功能。
- 右上角放小頭像（已登入）或「登入」連結（未登入）。

---

## 七、開發順序（請 Claude Code 嚴格分段）

**每段做完先停下讓開發者測試確認，再做下一段**。

1. **Step 1：環境準備**
   - 安裝 SDK、設定環境變數、在 Supabase Dashboard 完成 Step 1～5。
   - 驗收：`.env.local` 與 Vercel 都有變數，能在瀏覽器 console 用 Supabase client 連到 project。

2. **Step 2：資料庫 schema**
   - 在 Supabase SQL Editor 跑第三節的 SQL。
   - 驗收：四個資料表存在、RLS 開啟、新使用者註冊會自動建 profile 與 preferences。

3. **Step 3：Supabase clients + middleware + AuthProvider**
   - 建立 `src/lib/supabase/`、`src/middleware.ts`、`src/components/AuthProvider.tsx`。
   - 把 layout.tsx 包上 AuthProvider。
   - 驗收：頁面能透過 `useAuth()` 拿到 user（沒登入時為 null）。

4. **Step 4：登入頁 + callback**
   - 實作 `/login` 與 `/auth/callback`。
   - 驗收：能用公司 Email 收到信、點連結後登入成功、Header 顯示登入狀態。
   - 非公司網域的 Email 會被擋下。

5. **Step 5：個人頁 + 編輯個人資料頁**
   - 替換 `/profile` 與新增 `/profile/edit`。
   - 驗收：能填寫並儲存個資；選填欄位的用途說明清楚顯示。

6. **Step 6：收藏功能遷移**
   - 改寫 `FavButton`、新增 `src/lib/favorites.ts`。
   - 實作 `migrateLocalData`，在 AuthProvider 偵測到剛登入時呼叫。
   - 驗收：未登入時收藏照常運作；登入後 localStorage 內的收藏被同步到資料庫，UI 出現一次性提示「已將收藏同步到雲端」；登出後再登入收藏還在。
   - **重點測試**：開兩個瀏覽器（或無痕視窗）用同一帳號登入，A 加收藏、B 重整能看到。

7. **Step 7：偏好分類遷移**
   - 同樣的模式套用 `preferences.ts` 與相關 UI。
   - 驗收：偏好分類跨裝置同步。

8. **Step 8：替換收藏頁**
   - 改寫 `/favorites` 從佔位頁變成真實列表頁。
   - 驗收：已登入看雲端、未登入看 local。

9. **Step 9：整體流程測試與微調**
   - 找 2～3 個同事測完整登入到收藏的流程，收回饋。
   - 處理常見問題：Email 進到垃圾信、Magic Link 過期、不同瀏覽器表現。

---

## 八、安全與隱私

### 必做
- [ ] 所有資料表 RLS 開啟。
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 只在 server-side 出現，**不能** import 到 client component。
- [ ] `.env.local` 在 `.gitignore`（現有專案已符合）。
- [ ] 敏感欄位（phone、common_address）：
  - 員工間互相檢視時不顯示。
  - 福委會後台檢視會寫入 `privacy_access_logs`（本階段先建表，後台功能後續開發）。
- [ ] Magic Link Email 模板改為中文，提示「若非本人請忽略」。

### 公司網域限制
- 本階段於前端 `isAllowedEmail()` 檢查。**這只是 UX 層的提醒**，技術上仍可被繞過。
- 正式上線前評估是否需要 Supabase Database Function 在 server 端強制拒絕非公司網域註冊。

---

## 九、給未來工程師接手的提醒

當這份系統交給公司 IT 工程師時，本規格已提供：
- 完整資料庫 schema（含 RLS、trigger）。
- 程式碼結構約束（Supabase 相關集中在 `src/lib/supabase/` 與 `src/lib/auth/`）。
- 遷移邏輯範例（localStorage → 雲端）。
- 環境變數清單。

工程師接手後可獨立評估的事項：
- 是否從 Supabase 遷移到 AWS Cognito + RDS。
- 是否加上 2FA / SSO 整合（公司 AD）。
- 是否加上更嚴格的 server-side 網域驗證。
- 個資加密（at-rest encryption，Supabase 預設已有，AWS 上需另設）。

---

## 十、不在本階段做的事（避免範圍膨脹）

- ❌ 福委會員工後台介面（資料表已預留 `is_staff_committee` 欄位，後台 UI 留待後續）。
- ❌ 揪飯友、求跑腿、點數（第二階段）。
- ❌ 大頭貼上傳（Supabase Storage 設定，可下一輪做）。
- ❌ 推播通知。
- ❌ 多公司 SaaS。

---

## 十一、驗收總清單

- [ ] 同事可用公司 Email 收到 Magic Link 並登入。
- [ ] 非公司網域 Email 被擋下並有清楚提示。
- [ ] 登入後 `/profile` 顯示自己的資料、可編輯。
- [ ] 選填欄位有用途說明、不強制填。
- [ ] 登入前 localStorage 的收藏，登入後自動同步到資料庫且不重複。
- [ ] 多裝置登入同一帳號，收藏即時同步（重整後可見）。
- [ ] 偏好分類同樣跨裝置同步。
- [ ] 登出後再登入，所有資料仍在。
- [ ] 未登入仍可正常瀏覽店家（不擋路）。
- [ ] 所有 Supabase 資料表 RLS 開啟，跨使用者無法看到別人資料。
- [ ] Vercel Production 環境變數設定完成。
- [ ] Magic Link Email 為中文模板。
