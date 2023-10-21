import LocalStorage from "./LocalStorage";

type MainColumnsStorageData = Record<string, { width: number }>;

const mainColumnsStorage = new LocalStorage<MainColumnsStorageData>("main-columns");

export default mainColumnsStorage;
