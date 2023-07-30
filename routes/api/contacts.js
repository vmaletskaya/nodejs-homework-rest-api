import express from "express";
import ctrl from "../../controllers/contacts.js";
import isValidId from "../../middleware/isValidId.js";
import validateBody from "../../middleware/validateBody.js";
import authenticate from "../../middleware/authenticate.js";
import { addSchema, updateFavoriteSchema } from "../../models/contact.js";

const router = express.Router();

//GET :all
router.get("/", authenticate, ctrl.getAll);

// //GET :by id
router.get("/:contactId", authenticate, isValidId, ctrl.getById);

// //POST :add
router.post("/", authenticate, validateBody(addSchema), ctrl.AddContact);

// //PUT : update by id
router.put(
  "/:contactId",
  authenticate,
  isValidId,
  validateBody(addSchema),
  ctrl.modifyContact
);

// // PATCH :edit by id
router.patch(
  "/:contactId/favorite",
  authenticate,
  isValidId,
  validateBody(updateFavoriteSchema),
  ctrl.updateStatusContact
);
// //DELETE : by id
router.delete("/:contactId", authenticate, isValidId, ctrl.deleteContact);

export default router;
