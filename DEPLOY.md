# Deployment Guide

## 1. Deploy to Google Cloud Run (Johannesburg, South Africa)

To deploy the application to Cloud Run in region `africa-south1` (Johannesburg):

```bash
gcloud run deploy itreal \
  --source . \
  --region africa-south1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

If you need to supply Firebase client environment variables during build or runtime, specify them with `--set-env-vars`:
```bash
gcloud run deploy itreal \
  --source . \
  --region africa-south1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,VITE_FIREBASE_API_KEY=YOUR_API_KEY,VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN,VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID,VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET,VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID,VITE_FIREBASE_APP_ID=YOUR_APP_ID,VITE_FIREBASE_DATABASE_ID=ai-studio-051dde94-820b-4509-9197-5fcb33f887a2
```

## 2. Deploy Firebase Rules Only (Firestore & Storage)

To deploy only the security rules without deploying hosting or functions:

```bash
# Deploy both firestore.rules and storage.rules
firebase deploy --only firestore:rules,storage

# Or deploy individually:
firebase deploy --only firestore:rules
firebase deploy --only storage
```
