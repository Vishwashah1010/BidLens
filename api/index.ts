import appInstance from "../server";
const app = (appInstance as any).default || appInstance;
export default app;
