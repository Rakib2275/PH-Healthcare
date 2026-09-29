import { Router } from "express";
import { AppointementController } from "./appointement.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";


const router = Router();

router.post("/book-appointment",auth(Role.PATIENT),AppointementController.bookAppointement)

router.post("/pay-appointment",auth(Role.PATIENT),AppointementController.payAppointment,);
//appointment payment
router.get("/book-appointment/payment/callback",AppointementController.bookAppointementCallback)

export const AppointementRoutes = router;