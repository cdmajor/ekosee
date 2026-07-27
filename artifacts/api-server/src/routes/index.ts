import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { ekoseeRouter } from "./ekosee";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ekoseeRouter);

export default router;
