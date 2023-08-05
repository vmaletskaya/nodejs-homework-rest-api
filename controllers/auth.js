import bcrypt from "bcryptjs";
import gravatar from "gravatar";
import path from "path";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import { User } from "../models/user.js";
import { HttpError } from "../helpers/HttpError.js";
import ctrlWrapper from "./ctrlWrapper.js";

const avatarDir = path.resolve("public", "avatars");

//signup
const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }
  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL: gravatar.url(email, { s: 250, d: "identicon", protocol: "https" }),
  });

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
      avatarURL: newUser.avatarURL,
    },
  });
};

//login
const login = async (req, res) => {
  const { email, password } = req.body;
  const { SECRET_KEY } = process.env;

  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);

  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }

  const payload = { id: user._id };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token: token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

//logout
const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).json({});
};

// Change Subscription
const changeSubscription = async (req, res) => {
  const { _id } = req.user;
  const updatedSubscription = await User.findByIdAndUpdate(_id, { subscription: req.body.subscription }, { new: true });
  if (!updatedSubscription) throw HttpError(404, "Not found");
  const { email, subscription } = updatedSubscription;
  res.status(200).json({ email, subscription });
};

// current user info
const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;
  res.json({ email, subscription });
};

//Change Avatar
const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;

  const filename = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarDir, filename);
  await fs.rename(tempUpload, resultUpload);

  const avatarURL = path.join("avatars", filename);
  await User.findByIdAndUpdate(_id, { avatarURL }, { new: true });

  res.status(200).json({ avatarURL });
};

// decoration
const ctrl = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  logout: ctrlWrapper(logout),
  getCurrent: ctrlWrapper(getCurrent),
  changeSubscription: ctrlWrapper(changeSubscription),
  updateAvatar: ctrlWrapper(updateAvatar),
};

//export

export default ctrl;