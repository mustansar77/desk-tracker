import Store from "electron-store";

export interface SavedSession {
  access_token: string;
  refresh_token: string;
}

export interface ActiveEntry {
  id: string;
  userId: string;
  startTime: string;
  projectId: string | null;
}

interface StoreSchema {
  session: SavedSession | null;
  consentAccepted: boolean;
  activeEntry: ActiveEntry | null;
}

const store = new Store<StoreSchema>({
  defaults: {
    session: null,
    consentAccepted: false,
    activeEntry: null,
  },
});

export default store;
