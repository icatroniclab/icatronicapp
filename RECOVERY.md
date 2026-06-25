# Guía de Recuperación — IcatronicApp

## Servicios utilizados

| Servicio | URL | Para qué |
|----------|-----|----------|
| GitHub | github.com/icatroniclab/icatronicapp | Código fuente |
| Vercel | vercel.com | Hosting de la app |
| Neon | neon.tech | Base de datos PostgreSQL |
| Cloudinary | cloudinary.com | Fotos y archivos subidos |

Cuenta de acceso a todos: **icatronic.lab@gmail.com**

---

## Variables de entorno necesarias

Estas variables deben estar en el `.env` local y en Vercel → Settings → Environment Variables:

```
DATABASE_URL=          # Neon → Connection Details → .env → DATABASE_URL
NEXTAUTH_SECRET=       # Valor fijo, está en .env local
CLOUDINARY_CLOUD_NAME= # Cloudinary → Dashboard → Cloud name
CLOUDINARY_API_KEY=    # Cloudinary → Settings → API Keys
CLOUDINARY_API_SECRET= # Cloudinary → Settings → API Keys
ANTHROPIC_API_KEY=     # console.anthropic.com → API Keys
VAPID_PUBLIC_KEY=      # Valor fijo, está en .env local
VAPID_PRIVATE_KEY=     # Valor fijo, está en .env local
```

**El archivo `.env` local tiene todos los valores reales. Guardalo en un lugar seguro.**

---

## Hacer backup de los datos

```bash
node --env-file=.env scripts/backup-data.js
```

Genera un archivo `backup-icatronic-FECHA.json` en la raíz del proyecto.
Hacerlo periódicamente (1 vez por semana recomendado).

---

## Redeploy manual (si la app deja de funcionar)

```bash
git push origin main
```

Vercel redespliega automáticamente al hacer push. Si no:
1. Ir a vercel.com → proyecto → Deployments
2. Click en los tres puntos del último deployment → "Redeploy"

---

## Restaurar la base de datos desde backup

Si la base de datos se pierde, restaurar con el script de migración:

1. Asegurarse que `DATABASE_URL` en `.env` apunta al Neon correcto
2. Correr `npx prisma generate`
3. Correr `npx prisma db push` (crea las tablas)
4. Modificar `scripts/migrate-to-neon.js` para leer desde el JSON de backup en vez de SQLite
   (o contactar soporte técnico)

---

## Repositorio GitHub

- Organización: **icatroniclab**
- Repo: **icatronicapp**
- Branch principal: **main**

Si se pierde acceso a GitHub, el código también está en la PC local en:
`C:\Users\leonardo\icatronicapp`
