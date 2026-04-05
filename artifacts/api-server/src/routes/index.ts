import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import recordsRouter from "./records";
import dashboardRouter from "./dashboard";
import rentalRouter from "./rental";
import analystRouter from "./analyst";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(recordsRouter);
router.use(dashboardRouter);
router.use(rentalRouter);
router.use(analystRouter);


export default router;
