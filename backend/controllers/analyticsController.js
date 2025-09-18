const Report = require('../models/reportModel');
const Department = require('../models/departmentModel');

const getReportingTrends = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            category: "$category"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trends' });
  }
};

const getDepartmentMetrics = async (req, res) => {
  try {
    const metrics = await Report.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'assignedDepartment',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$department.name',
          totalReports: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'Resolved'] },
                { $subtract: ['$updatedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    res.json({ metrics });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching department metrics' });
  }
};

const getSystemEffectiveness = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const resolvedReports = await Report.countDocuments({ status: 'Resolved' });
    const avgResolutionTime = await Report.aggregate([
      { $match: { status: 'Resolved' } },
      {
        $group: {
          _id: null,
          avgTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
        }
      }
    ]);

    const effectiveness = {
      totalReports,
      resolvedReports,
      resolutionRate: ((resolvedReports / totalReports) * 100).toFixed(2),
      avgResolutionTime: avgResolutionTime[0]?.avgTime || 0
    };

    res.json({ effectiveness });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching effectiveness metrics' });
  }
};

module.exports = {
  getReportingTrends,
  getDepartmentMetrics,
  getSystemEffectiveness
};