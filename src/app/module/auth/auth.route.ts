import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";
import { LoginZodSchema, PatienRegistrationZodSchema } from "./authValidation";
import { catchAsync } from "../../utils/catchAsync";
import z from "zod";
import { validedRequest } from "../../middleware/validedRequest";

const router = Router();


router.post("/register",
	// (req: Request,res: Response,next:NextFunction)=>{
	// 	try {
	// 		const payload = req.body ?? {}

	// 	const result = PatienRegistrationZodSchema.safeParse(payload)
		
	// 	if(!result.success){
	// 		console.log(result.error);
	// 		console.log(result.error.issues)

	// 		throw new Error(result.error.issues[0].message)
	// 	}

	// 	req.body = result.data
	// 	next()
	// 	} catch (error) {
	// 		next(error)
	// 	}

	// },
	validedRequest(PatienRegistrationZodSchema),
	 AuthController.registerPatient);
router.post("/login",
	validedRequest(LoginZodSchema),
	AuthController.loginUser);
router.get(
	"/me",
	auth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN),
	AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("google",AuthController.googleLogin)
export const AuthRoutes = router;
