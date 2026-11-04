
import {
  initializeApp,
  applicationDefault,
  getApps
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";

import env from "./env.js";

const firebaseAdminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: applicationDefault(),
        projectId: env.firebaseProjectId
      });

export const firebaseAdminAuth = getAuth(firebaseAdminApp);
