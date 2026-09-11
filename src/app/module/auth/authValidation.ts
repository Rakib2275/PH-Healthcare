import z from "zod";

export const PatienRegistrationZodSchema = z.object({
	name : z.string().min(4).max(20),
	email : z.email(),
	password : z.string().min(8, { message: "Password must be at least 8 characters long" })
  				.max(20, { message: "Password cannot exceed 20 characters" })
  				.regex(/[A-Z]/, {
    			message: "Password must contain at least one uppercase letter",
  				})
  				.regex(/[a-z]/, {
    			message: "Password must contain at least one lowercase letter",
  				})
  				.regex( /[0-9]/, {
    			message: "Password must contain at least one number",
  				})
  				.regex( /[!@#$%^&*]/, {
    			message: "Password must contain at least one special character (!@#$%^&*)",
  				}),
	patient : z.object({
		contactNumber : z.string().optional()
	}).optional()
})

export const LoginZodSchema = z.object({
	email : z.email(),
	password : z.string().min(8, { message: "Password must be at least 8 characters long" })
  				.max(20, { message: "Password cannot exceed 20 characters" })
  				.regex(/[A-Z]/, {
    			message: "Password must contain at least one uppercase letter",
  				})
  				.regex(/[a-z]/, {
    			message: "Password must contain at least one lowercase letter",
  				})
  				.regex( /[0-9]/, {
    			message: "Password must contain at least one number",
  				})
  				.regex( /[!@#$%^&*]/, {
    			message: "Password must contain at least one special character (!@#$%^&*)",
  				}),
})