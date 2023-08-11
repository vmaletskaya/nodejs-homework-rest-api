import express from "express";
import ctrl from "../../controllers/auth.js";
import { authSchema, subscriptionSchema, emailSchema} from "../../models/user.js";
import validateBody from "../../middleware/validateBody.js";
import authenticate from "../../middleware/authenticate.js";
import upload from "../../middleware/upload.js";
import resize from "../../middleware/resize.js";

const router = express.Router();

//signup
router.post("/register", validateBody(authSchema), ctrl.register);

// check verification
router.get("/verify/:verificationToken", ctrl.verificationRequest);

// resend verification email
router.post("/verify", validateBody(emailSchema), ctrl.reSendEmail); 

//signin
router.post("/login", validateBody(authSchema), ctrl.login);

// current user info
router.get("/current", authenticate, ctrl.getCurrent);

//logout
router.post("/logout", authenticate, ctrl.logout);

//change subscription
router.patch("/", authenticate, validateBody(subscriptionSchema), ctrl.changeSubscription);

// change avatar
router.patch("/avatars", authenticate, upload.single("avatar"), resize, ctrl.updateAvatar);


export default router;