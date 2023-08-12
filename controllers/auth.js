import bcrypt from "bcryptjs";
import gravatar from "gravatar";
import path from "path";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import { User } from "../models/user.js";
import { HttpError } from "../helpers/HttpError.js";
import ctrlWrapper from "./ctrlWrapper.js";
import sendMail from "../helpers/sendEmail.js";
import { nanoid } from "nanoid";

const avatarDir = path.resolve("public", "avatars");

//signup
const register = async (req, res) => {
  const { BASE_URL } = process.env;
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const verificationCode = nanoid();

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL: gravatar.url(email, { s: 250, d: "identicon", protocol: "https" }),
    verificationToken: verificationCode,
  });

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationCode}" style="width: 100%; background-color: #B4A5A5; padding: 15px 25px; border-radius: 6px; text-align: center; text-decoration: none; color: #3C415C; font-size: 20px">Click to Verify email</a>`,
  };
  await sendMail(verifyEmail);

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
      avatarURL: newUser.avatarURL,
    },
  });
};

// verification
const verificationRequest = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) throw HttpError(404, "User not found");

  await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: "" });

  res.status(202).json({
    message: "Verification successful",
  });
};

//resend Email
const reSendEmail = async (req, res) => {
  const { email } = req.body; 
  const {BASE_URL} = process.env
  const user = await User.findOne({ email });
  if (!user) throw HttpError(404, "User not found");
  if (user.verify) throw HttpError(400, "Verification has already been passed");

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/users/verify/${user.verificationToken}" style="width: 100%; background-color: #B4A5A5; padding: 15px 25px; border-radius: 6px; text-align: center; text-decoration: none; color: #3C415C; font-size: 20px">Click to Verify email</a>`,
  };
  
  await sendMail(verifyEmail);

  res.status(200).json({
    message: "Verification email sent",
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

  if (!user.verify) {
    throw HttpError(401, "Email not verified");
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
  verificationRequest: ctrlWrapper(verificationRequest),
  reSendEmail: ctrlWrapper(reSendEmail),
};

//export

export default ctrl;