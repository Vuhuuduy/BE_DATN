import Contact from "../models/Contact.js";
import { sendEmail } from "../utils/sendMail.js"; // chỗ này import file bạn đã viết

// Admin trả lời liên hệ
// replyContact
export const replyContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ message: "Không tìm thấy liên hệ" });
    }

    // thêm phản hồi mới
    contact.status = "replied";
    contact.replies.push(replyMessage);
    await contact.save();

    // gửi mail
    await sendEmail(
      contact.email,
      "Phản hồi từ Fashion Store",
      replyMessage
    );

    res.json({ message: "Đã trả lời và gửi email thành công", contact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi trả lời liên hệ" });
  }
};
