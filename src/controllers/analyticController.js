import Analytic from '../models/analytic.js';

// Lấy analytic mới nhất
export const getAnalyticData = async (_req, res) => {
  try {
    const data = await Analytic.findOne().sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy analytic', error: err });
  }
};

// Tạo analytic mới
export const createAnalytic = async (req, res) => {
  try {
    const newAnalytic = new Analytic(req.body);
    await newAnalytic.save();
    res.status(201).json(newAnalytic);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo analytic', error: err });
  }
};
