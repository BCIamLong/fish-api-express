const nodemailer = require("nodemailer");

const sendEmail = async options => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const optionsInfo = {
    from: "Fish website <fishweb@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: `<h1>${options.subject}</h1>`,
  };

  await transporter.sendMail(optionsInfo);
};

module.exports = { sendEmail };
