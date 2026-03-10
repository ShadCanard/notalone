# NotAlone — Copilot Instructions

## Projet

**NotAlone** est un réseau social bienveillant conçu pour lutter contre la dépression et l'isolement social. L'application offre un espace chaleureux où les utilisateurs peuvent partager leurs pensées, soutenir les autres et se rappeler qu'ils ne sont jamais seuls.

## Architecture

Monorepo **Nx** (`22.5.x`) avec npm workspaces.

```
notalone/
├── apps/
│   ├── web/              # Frontend Next.js (Page Router)
│   └── server/           # Backend GraphQL (Express + graphql-yoga)
├── packages/             # Librairies partagées (futur)
├── prisma/
│   └── schema.prisma     # Schéma de base de données
├── .vscode/
│   └── tasks.json        # Tâches VS Code (Ctrl+Shift+B)
├── nx.json               # Configuration Nx
└── package.json          # Scripts racine + concurrently
```

### Projets Nx

| Projet   | Chemin          | Type        | Commande dev                        |
|----------|-----------------|-------------|-------------------------------------|
| `web`    | `apps/web`      | application | `next dev --turbopack -p 3000`      |
| `server` | `apps/server`   | application | `tsx watch src/index.ts`            |

## Stack technique

### Frontend (`apps/web`)

- **Framework** : Next.js 15 avec **Page Router** (dossier `src/pages/`)
- **Bundler dev** : Turbopack (`next dev --turbopack`)
- **UI** : Mantine 7 (`@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/notifications`)
- **Icônes** : `@tabler/icons-react`
- **Requêtes API** : TanStack React Query 5 (`@tanstack/react-query`) avec **DevTools** (`@tanstack/react-query-devtools`)
- **Client GraphQL** : `graphql-request`
- **PostCSS** : `postcss-preset-mantine` + `postcss-simple-vars`
- **Port** : `3000`

### Backend (`apps/server`)

- **Runtime** : Node.js avec `tsx` (TypeScript en mode watch)
- **Serveur HTTP** : Express 5
- **API GraphQL** : `graphql-yoga` avec **GraphiQL** activé
- **Endpoint** : `http://localhost:4000/graphql`
- **Port** : `4000`

### Base de données

- **SGBD** : MariaDB
- **ORM** : Prisma 6 (`@prisma/client`) avec **Prisma Studio**
- **URL de connexion** : `mysql://root:omfg@localhost:3306/notalone`
- **Schéma** : `prisma/schema.prisma`

### Authentification

- **Hachage** : `bcryptjs` (12 rounds)
- **Tokens** : JWT (`jsonwebtoken`) — expiration 7 jours
- **Stockage côté client** : `localStorage` (`notalone_token`, `notalone_user`)
- **Transport** : Header `Authorization: Bearer <token>`

## Modèles de données (Prisma)

| Modèle    | Champs clés                                                         | Relations                           |
|-----------|---------------------------------------------------------------------|-------------------------------------|
| `User`    | id, email (unique), username (unique), password, firstName, lastName, bio, avatar | posts, comments, likes, messages    |
| `Post`    | id, content, mood, isPublic, authorId                               | author → User, comments, likes      |
| `Comment` | id, content, authorId, postId                                       | author → User, post → Post          |
| `Like`    | id, userId, postId (@@unique)                                       | user → User, post → Post            |
| `Message` | id, content, read, senderId, receiverId                             | sender → User, receiver → User      |

Toutes les suppressions sont en **cascade** (`onDelete: Cascade`).

## Thème et design

- **Couleur primaire** : `warmOrange` — palette de tons orangés chaleureux (#fff4e6 → #bf4000)
- **Couleurs secondaires** : `warmCoral` (tons rouges doux), `warmGreen` (tons verts apaisants)
- **Police** : Inter (avec fallbacks système)
- **Arrondis** : généreux (buttons `xl`, cards `lg`, inputs `md`)
- **Fond principal** : `#FFF8F0` (crème chaud)
- **Header** : dégradé orange `linear-gradient(135deg, #FF922B, #FD7E14, #E8590C)`
- **Navbar** : fond `#FFFAF5` avec bordure `#FFE8CC`
- **Ton général** : chaleureux, accueillant, bienveillant — messages en français tutoiement

## Pages

| Route       | Fichier                          | Description                                    | Auth requise |
|-------------|----------------------------------|------------------------------------------------|--------------|
| `/`         | `src/pages/index.tsx`            | Fil d'actualité, création de post, hero banner | Non (lecture) |
| `/login`    | `src/pages/login.tsx`            | Formulaire de connexion                        | Non          |
| `/register` | `src/pages/register.tsx`         | Formulaire d'inscription                       | Non          |
| `/profile`  | `src/pages/profile.tsx`          | Profil utilisateur modifiable                  | Oui          |
| `/messages` | `src/pages/messages.tsx`         | Messagerie (placeholder)                       | Oui          |

## Composants principaux

| Composant        | Fichier                              | Rôle                                              |
|------------------|--------------------------------------|----------------------------------------------------|
| `Layout`         | `src/components/Layout.tsx`          | AppShell Mantine (header, navbar, menu utilisateur) |
| `PostCard`       | `src/components/PostCard.tsx`        | Affichage d'un post avec likes, commentaires        |
| `CreatePostForm` | `src/components/CreatePostForm.tsx`  | Formulaire de création de post avec humeur          |

## Hooks personnalisés

Tous définis dans `src/hooks/useApi.ts` :

- `useLogin()` / `useRegister()` — mutations d'authentification
- `useMe()` — query du profil connecté
- `usePosts(limit, offset)` — query du fil d'actualité
- `useCreatePost()` — mutation de création de post
- `useToggleLike()` — mutation like/unlike
- `useCreateComment()` — mutation d'ajout de commentaire
- `useUpdateProfile()` — mutation de mise à jour du profil

## API GraphQL

### Queries

- `me` — utilisateur connecté
- `user(id)` — un utilisateur par ID
- `users` — tous les utilisateurs
- `posts(limit, offset)` — posts publics paginés
- `post(id)` — un post par ID
- `myPosts` — posts de l'utilisateur connecté
- `messages(userId)` — conversation avec un utilisateur

### Mutations

- `register(email, username, password, firstName?, lastName?)` → AuthPayload
- `login(email, password)` → AuthPayload
- `createPost(content, mood?, isPublic?)` → Post
- `deletePost(id)` → Boolean
- `createComment(postId, content)` → Comment
- `toggleLike(postId)` → Boolean
- `sendMessage(receiverId, content)` → Message
- `markMessageRead(id)` → Message
- `updateProfile(firstName?, lastName?, bio?, avatar?)` → User

## Scripts npm

| Script             | Commande                                                                    |
|--------------------|-----------------------------------------------------------------------------|
| `dev`              | `concurrently` lance Web + Server + Prisma Studio avec labels colorés       |
| `dev:web`          | `nx dev web` — Next.js en mode dev                                          |
| `dev:server`       | `nx dev server` — serveur GraphQL en mode watch                             |
| `prisma:studio`    | `npx prisma studio` — interface d'admin BDD                                |
| `prisma:generate`  | `npx prisma generate` — régénère le client Prisma                           |
| `prisma:migrate`   | `npx prisma migrate dev` — crée et applique une migration                   |
| `prisma:push`      | `npx prisma db push` — synchronise le schéma sans migration                 |
| `build`            | `nx run-many --target=build` — build de tous les projets                    |

## Tâches VS Code (Ctrl+Shift+B)

- 🚀 **Dev (All)** — lance tout avec concurrently (tâche par défaut)
- 🌐 **Dev: Web (Next.js)** — frontend seul
- ⚙️ **Dev: Server (GraphQL)** — backend seul
- 📊 **Prisma Studio** — interface d'admin BDD
- 🔄 **Prisma Generate** — régénérer le client
- 📦 **Prisma Migrate (Dev)** — nouvelle migration
- 📤 **Prisma DB Push** — push du schéma
- 🏗️ **Build All** — build complet

## Variables d'environnement

| Variable             | Fichier           | Valeur                                           |
|----------------------|-------------------|--------------------------------------------------|
| `DATABASE_URL`       | `.env`            | `mysql://root:omfg@localhost:3306/notalone`       |
| `JWT_SECRET`         | `.env`            | `notalone-secret-key-change-in-production`        |
| `NEXT_PUBLIC_API_URL`| `apps/web/.env.local` | `http://localhost:4000/graphql`               |

## Conventions de code

- **Langue de l'interface** : français, tutoiement
- **Langue du code** : anglais (noms de variables, fonctions, types)
- **Framework CSS** : Mantine uniquement (pas de Tailwind)
- **Requêtes API** : toujours via les hooks TanStack React Query (jamais de fetch direct dans les composants)
- **GraphQL** : requêtes définies avec le tag `gql` dans `src/hooks/useApi.ts`
- **Auth** : vérification via le contexte `useAuth()`, redirection vers `/login` si non authentifié
- **Notifications** : via `@mantine/notifications` (`notifications.show()`)
- **Formulaires** : via `@mantine/form` (`useForm()`)
- **Router** : Next.js Page Router (`useRouter()` de `next/router`)
- **Imports serveur** : suffixe `.js` obligatoire (module `nodenext`)

## Démarrage du projet

1. S'assurer que MariaDB tourne avec une base `notalone` créée
2. `npm install`
3. `npm run prisma:push` — crée les tables
4. `npm run dev` — lance tout (Web sur :3000, Server sur :4000, Prisma Studio sur :5555)
