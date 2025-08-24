import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (email, subject, text) => {
  try {
    const mailOptions = {
      from: `Vu Huu Duy <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
  } catch (error) {
    console.error("Lỗi gửi email:", error);
    throw new Error("Error sending email: " + error.message);
  }
};

export const sendContactEmail = async (name, email, message) => {
  try {
    const subject = `Liên hệ từ khách hàng: ${name}`;
    const text = `Tên: ${name}\nEmail: ${email}\n\nNội dung:\n${message}`;

    const mailOptions = {
      from: email,
      to: "duy3atv@gmail.com", // Email nhận cố định
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Contact email sent: ", info.response);
  } catch (error) {
    console.error("Lỗi gửi contact email:", error);
    throw new Error("Error sending contact email: " + error.message);
  }
};

// ✅ Hàm gửi email xác nhận đơn hàng
export const sendOrderEmail = async (customerEmail, orderId, fullName, totalAmount = 0) => {
  try {
    const subject = `Xác nhận đơn hàng #${orderId}`;
    const text = `Xin chào ${fullName},\n\n` +
      `Cảm ơn bạn đã đặt hàng tại Fashion Store!\n\n` +
      `Mã đơn hàng: ${orderId}\n` +
      `Tổng tiền: ${(totalAmount || 0).toLocaleString()}₫\n\n` +
      `Chúng tôi sẽ sớm liên hệ và giao hàng cho bạn.\n\n` +
      `Trân trọng,\nFashion Store`;

    const mailOptions = {
      from: `"Fashion Store" <${process.env.EMAIL_USERNAME}>`,
      to: customerEmail,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Order email sent: ", info.response);
  } catch (error) {
    console.error("Lỗi gửi order email:", error);
    throw new Error("Error sending order email: " + error.message);
  }
};

