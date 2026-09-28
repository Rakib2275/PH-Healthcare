import { Router } from "express";
import { AppointementController } from "./appointement.controller";


const router = Router();

router.post("/book-appointment",AppointementController.bookAppointement)


//appointment payment
router.get("/book-appointment/payment/callback",AppointementController.bookAppointementCallback)

export const AppointementRoutes = router;