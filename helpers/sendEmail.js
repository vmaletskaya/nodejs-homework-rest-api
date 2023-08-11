import sgMail from "@sendgrid/mail";

export default async function sendMail(data) {
  const { SENDGRID_KEY } = process.env;
  sgMail.setApiKey(SENDGRID_KEY);

  const response = await sgMail.send({ ...data, from: "v.maletskayaah@gmail.com" });

  return response;
}

